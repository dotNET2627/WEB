using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoInventoryBatchRepository : IInventoryBatchRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoInventoryBatchRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<InventoryBatch?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = _sessionAccessor.Current is { } session
            ? await _context.InventoryBatches.Find(session, d => d.Id == id).FirstOrDefaultAsync(cancellationToken)
            : await _context.InventoryBatches.Find(d => d.Id == id).FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : InventoryBatchDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<InventoryBatch>> ListByItemAsync(Guid clinicId, Guid inventoryItemId, CancellationToken cancellationToken)
    {
        var filter = Builders<InventoryBatchDocument>.Filter.And(
            Builders<InventoryBatchDocument>.Filter.Eq(d => d.ClinicId, clinicId),
            Builders<InventoryBatchDocument>.Filter.Eq(d => d.InventoryItemId, inventoryItemId));

        var documents = await _context.InventoryBatches
            .Find(filter)
            .SortBy(d => d.ExpirationDate)
            .ToListAsync(cancellationToken);

        return documents.Select(InventoryBatchDocumentMapper.ToDomain).ToList();
    }

    public async Task<IReadOnlyList<InventoryBatch>> ListByClinicAsync(Guid clinicId, CancellationToken cancellationToken)
    {
        var documents = await _context.InventoryBatches
            .Find(d => d.ClinicId == clinicId)
            .SortBy(d => d.ExpirationDate)
            .ToListAsync(cancellationToken);

        return documents.Select(InventoryBatchDocumentMapper.ToDomain).ToList();
    }

    public async Task<IReadOnlyList<InventoryBatch>> ListAvailableFefoAsync(
        Guid clinicId,
        Guid inventoryItemId,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var builder = Builders<InventoryBatchDocument>.Filter;
        var filter = builder.And(
            builder.Eq(d => d.ClinicId, clinicId),
            builder.Eq(d => d.InventoryItemId, inventoryItemId),
            builder.Gt(d => d.QuantityOnHand, 0),
            builder.Gte(d => d.ExpirationDate, today));

        var findFluent = _sessionAccessor.Current is { } session
            ? _context.InventoryBatches.Find(session, filter)
            : _context.InventoryBatches.Find(filter);

        var documents = await findFluent
            .SortBy(d => d.ExpirationDate)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        return documents.Select(InventoryBatchDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(InventoryBatch batch, CancellationToken cancellationToken)
    {
        var document = InventoryBatchDocumentMapper.ToDocument(batch);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.InventoryBatches.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.InventoryBatches.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(InventoryBatch batch, CancellationToken cancellationToken)
    {
        var document = InventoryBatchDocumentMapper.ToDocument(batch);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.InventoryBatches.ReplaceOneAsync(session, d => d.Id == batch.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.InventoryBatches.ReplaceOneAsync(d => d.Id == batch.Id, document, cancellationToken: cancellationToken);
    }
}
