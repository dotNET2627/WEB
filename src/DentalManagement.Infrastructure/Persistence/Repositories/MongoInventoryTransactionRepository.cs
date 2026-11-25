using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoInventoryTransactionRepository : IInventoryTransactionRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoInventoryTransactionRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<IReadOnlyList<InventoryTransaction>> ListByClinicAsync(
        Guid clinicId,
        Guid? inventoryItemId,
        InventoryTransactionType? type,
        CancellationToken cancellationToken)
    {
        var builder = Builders<InventoryTransactionDocument>.Filter;
        var filter = builder.Eq(d => d.ClinicId, clinicId);

        if (inventoryItemId is not null)
        {
            filter &= builder.Eq(d => d.InventoryItemId, inventoryItemId.Value);
        }

        if (type is not null)
        {
            filter &= builder.Eq(d => d.Type, type.Value.ToString());
        }

        var documents = await _context.InventoryTransactions
            .Find(filter)
            .SortByDescending(d => d.CreatedAt)
            .Limit(200)
            .ToListAsync(cancellationToken);

        return documents.Select(InventoryTransactionDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(InventoryTransaction transaction, CancellationToken cancellationToken)
    {
        var document = InventoryTransactionDocumentMapper.ToDocument(transaction);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.InventoryTransactions.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.InventoryTransactions.InsertOneAsync(document, cancellationToken: cancellationToken);
    }
}
