using System.Text.RegularExpressions;
using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Catalog;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoServiceRepository : IServiceRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoServiceRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<DentalService?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.Services
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : ServiceDocumentMapper.ToDomain(document);
    }

    public async Task<DentalService?> GetByCodeAsync(string code, CancellationToken cancellationToken)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var document = await _context.Services
            .Find(x => x.Code == normalized)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : ServiceDocumentMapper.ToDomain(document);
    }

    public Task<bool> ServiceCodeExistsAsync(string code, Guid? excludingId, CancellationToken cancellationToken)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var filterBuilder = Builders<ServiceDocument>.Filter;
        var filter = filterBuilder.Eq(x => x.Code, normalized);

        if (excludingId.HasValue)
        {
            filter &= filterBuilder.Ne(x => x.Id, excludingId.Value);
        }

        return _context.Services.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<PagedResult<DentalService>> SearchAsync(
        string? searchTerm,
        Guid? categoryId,
        bool? isActive,
        PagedQuery pagedQuery,
        CancellationToken cancellationToken)
    {
        var filterBuilder = Builders<ServiceDocument>.Filter;
        var filter = filterBuilder.Empty;

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var escapedTerm = Regex.Escape(searchTerm.Trim());
            var searchRegex = new BsonRegularExpression(escapedTerm, "i");
            filter &= filterBuilder.Or(
                filterBuilder.Regex(x => x.Code, searchRegex),
                filterBuilder.Regex(x => x.Name, searchRegex));
        }

        if (categoryId.HasValue)
        {
            filter &= filterBuilder.Eq(x => x.CategoryId, categoryId.Value);
        }

        if (isActive.HasValue)
        {
            filter &= filterBuilder.Eq(x => x.IsActive, isActive.Value);
        }

        var totalCount = await _context.Services.CountDocumentsAsync(filter, cancellationToken: cancellationToken);

        var documents = await _context.Services
            .Find(filter)
            .SortBy(x => x.Code)
            .Skip((pagedQuery.NormalizedPage - 1) * pagedQuery.NormalizedPageSize)
            .Limit(pagedQuery.NormalizedPageSize)
            .ToListAsync(cancellationToken);

        var items = documents.Select(ServiceDocumentMapper.ToDomain).ToList();

        return new PagedResult<DentalService>(
            items,
            pagedQuery.NormalizedPage,
            pagedQuery.NormalizedPageSize,
            totalCount);
    }

    public async Task<IReadOnlyList<DentalService>> GetAllActiveAsync(CancellationToken cancellationToken)
    {
        var documents = await _context.Services
            .Find(x => x.IsActive)
            .SortBy(x => x.CategoryName)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return documents.Select(ServiceDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(DentalService service, CancellationToken cancellationToken)
    {
        var document = ServiceDocumentMapper.ToDocument(service);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Services.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Services.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(DentalService service, CancellationToken cancellationToken)
    {
        var document = ServiceDocumentMapper.ToDocument(service);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Services.ReplaceOneAsync(
                session,
                x => x.Id == service.Id,
                document,
                cancellationToken: cancellationToken);
            return;
        }

        await _context.Services.ReplaceOneAsync(
            x => x.Id == service.Id,
            document,
            cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (_sessionAccessor.Current is { } session)
        {
            await _context.Services.DeleteOneAsync(
                session,
                x => x.Id == id,
                cancellationToken: cancellationToken);
            return;
        }

        await _context.Services.DeleteOneAsync(x => x.Id == id, cancellationToken: cancellationToken);
    }
}
