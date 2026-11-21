using System.Text.RegularExpressions;
using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Clinics;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoClinicRepository : IClinicRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoClinicRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Clinic?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.Clinics
            .Find(d => d.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : ClinicDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<Clinic>> GetAllAsync(bool activeOnly, CancellationToken cancellationToken)
    {
        var filter = activeOnly
            ? Builders<ClinicDocument>.Filter.Eq(d => d.IsActive, true)
            : Builders<ClinicDocument>.Filter.Empty;

        var documents = await _context.Clinics
            .Find(filter)
            .SortBy(d => d.Name)
            .ToListAsync(cancellationToken);

        return documents.Select(ClinicDocumentMapper.ToDomain).ToList();
    }

    public async Task<PagedResult<Clinic>> GetPagedAsync(
        int page,
        int pageSize,
        string? searchTerm,
        bool? activeOnly,
        CancellationToken cancellationToken)
    {
        var builder = Builders<ClinicDocument>.Filter;
        var filter = builder.Empty;

        if (activeOnly.HasValue)
        {
            filter &= builder.Eq(d => d.IsActive, activeOnly.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var pattern = new BsonRegularExpression(Regex.Escape(searchTerm.Trim()), "i");
            var searchFilter = builder.Or(
                builder.Regex(d => d.Name, pattern),
                builder.Regex(d => d.Address, pattern),
                builder.Regex(d => d.PhoneNumber, pattern));
            filter &= searchFilter;
        }

        var totalCount = await _context.Clinics.CountDocumentsAsync(filter, cancellationToken: cancellationToken);

        var documents = await _context.Clinics
            .Find(filter)
            .SortByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        var items = documents.Select(ClinicDocumentMapper.ToDomain).ToList();
        return new PagedResult<Clinic>(items, page, pageSize, totalCount);
    }

    public async Task<bool> NameExistsAsync(string name, Guid? excludeId, CancellationToken cancellationToken)
    {
        var builder = Builders<ClinicDocument>.Filter;
        var pattern = new BsonRegularExpression($"^{Regex.Escape(name.Trim())}$", "i");
        var filter = builder.Regex(d => d.Name, pattern);

        if (excludeId.HasValue)
        {
            filter &= builder.Ne(d => d.Id, excludeId.Value);
        }

        return await _context.Clinics.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task AddAsync(Clinic clinic, CancellationToken cancellationToken)
    {
        var document = ClinicDocumentMapper.ToDocument(clinic);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Clinics.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Clinics.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(Clinic clinic, CancellationToken cancellationToken)
    {
        var document = ClinicDocumentMapper.ToDocument(clinic);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Clinics.ReplaceOneAsync(session, d => d.Id == clinic.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Clinics.ReplaceOneAsync(d => d.Id == clinic.Id, document, cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (_sessionAccessor.Current is { } session)
        {
            await _context.Clinics.DeleteOneAsync(session, d => d.Id == id, cancellationToken: cancellationToken);
            return;
        }

        await _context.Clinics.DeleteOneAsync(d => d.Id == id, cancellationToken: cancellationToken);
    }
}
