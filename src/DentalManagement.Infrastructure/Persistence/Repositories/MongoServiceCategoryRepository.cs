using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Catalog;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoServiceCategoryRepository : IServiceCategoryRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoServiceCategoryRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<ServiceCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.ServiceCategories
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : ServiceCategoryDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<ServiceCategory>> GetAllAsync(CancellationToken cancellationToken)
    {
        var documents = await _context.ServiceCategories
            .Find(_ => true)
            .SortBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return documents.Select(ServiceCategoryDocumentMapper.ToDomain).ToList();
    }

    public Task<bool> CategoryNameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken)
    {
        var normalized = name.Trim();
        var filterBuilder = Builders<Documents.ServiceCategoryDocument>.Filter;
        var filter = filterBuilder.Regex(x => x.Name, new BsonRegularExpression($"^{normalized}$", "i"));

        if (excludingId.HasValue)
        {
            filter &= filterBuilder.Ne(x => x.Id, excludingId.Value);
        }

        return _context.ServiceCategories.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task AddAsync(ServiceCategory category, CancellationToken cancellationToken)
    {
        var document = ServiceCategoryDocumentMapper.ToDocument(category);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.ServiceCategories.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.ServiceCategories.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(ServiceCategory category, CancellationToken cancellationToken)
    {
        var document = ServiceCategoryDocumentMapper.ToDocument(category);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.ServiceCategories.ReplaceOneAsync(
                session,
                x => x.Id == category.Id,
                document,
                cancellationToken: cancellationToken);
            return;
        }

        await _context.ServiceCategories.ReplaceOneAsync(
            x => x.Id == category.Id,
            document,
            cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (_sessionAccessor.Current is { } session)
        {
            await _context.ServiceCategories.DeleteOneAsync(
                session,
                x => x.Id == id,
                cancellationToken: cancellationToken);
            return;
        }

        await _context.ServiceCategories.DeleteOneAsync(x => x.Id == id, cancellationToken: cancellationToken);
    }
}
