using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoInventoryItemRepository : IInventoryItemRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoInventoryItemRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<InventoryItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = _sessionAccessor.Current is { } session
            ? await _context.InventoryItems.Find(session, d => d.Id == id).FirstOrDefaultAsync(cancellationToken)
            : await _context.InventoryItems.Find(d => d.Id == id).FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : InventoryItemDocumentMapper.ToDomain(document);
    }

    public async Task<bool> ExistsByCodeAsync(Guid clinicId, string code, Guid? excludingId, CancellationToken cancellationToken)
    {
        var builder = Builders<InventoryItemDocument>.Filter;
        var filter = builder.And(
            builder.Eq(d => d.ClinicId, clinicId),
            builder.Eq(d => d.Code, code));

        if (excludingId is not null)
        {
            filter &= builder.Ne(d => d.Id, excludingId.Value);
        }

        return _sessionAccessor.Current is { } session
            ? await _context.InventoryItems.Find(session, filter).AnyAsync(cancellationToken)
            : await _context.InventoryItems.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryItem>> ListByClinicAsync(Guid clinicId, string? search, CancellationToken cancellationToken)
    {
        var builder = Builders<InventoryItemDocument>.Filter;
        var filter = builder.Eq(d => d.ClinicId, clinicId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var regex = new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(search.Trim()), "i");
            filter &= builder.Or(
                builder.Regex(d => d.Name, regex),
                builder.Regex(d => d.Code, regex),
                builder.Regex(d => d.Category, regex));
        }

        var documents = await _context.InventoryItems
            .Find(filter)
            .SortBy(d => d.Name)
            .ToListAsync(cancellationToken);

        return documents.Select(InventoryItemDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(InventoryItem item, CancellationToken cancellationToken)
    {
        var document = InventoryItemDocumentMapper.ToDocument(item);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.InventoryItems.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.InventoryItems.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(InventoryItem item, CancellationToken cancellationToken)
    {
        var document = InventoryItemDocumentMapper.ToDocument(item);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.InventoryItems.ReplaceOneAsync(session, d => d.Id == item.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.InventoryItems.ReplaceOneAsync(d => d.Id == item.Id, document, cancellationToken: cancellationToken);
    }
}
