using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoSupplierRepository : ISupplierRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoSupplierRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Supplier?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = _sessionAccessor.Current is { } session
            ? await _context.Suppliers.Find(session, d => d.Id == id).FirstOrDefaultAsync(cancellationToken)
            : await _context.Suppliers.Find(d => d.Id == id).FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : SupplierDocumentMapper.ToDomain(document);
    }

    public async Task<bool> ExistsByCodeAsync(Guid clinicId, string code, Guid? excludingId, CancellationToken cancellationToken)
    {
        var builder = Builders<SupplierDocument>.Filter;
        var filter = builder.And(
            builder.Eq(d => d.ClinicId, clinicId),
            builder.Eq(d => d.Code, code));

        if (excludingId is not null)
        {
            filter &= builder.Ne(d => d.Id, excludingId.Value);
        }

        return await _context.Suppliers.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Supplier>> ListByClinicAsync(Guid clinicId, CancellationToken cancellationToken)
    {
        var documents = await _context.Suppliers
            .Find(d => d.ClinicId == clinicId)
            .SortBy(d => d.Name)
            .ToListAsync(cancellationToken);

        return documents.Select(SupplierDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(Supplier supplier, CancellationToken cancellationToken)
    {
        var document = SupplierDocumentMapper.ToDocument(supplier);
        await _context.Suppliers.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(Supplier supplier, CancellationToken cancellationToken)
    {
        var document = SupplierDocumentMapper.ToDocument(supplier);
        await _context.Suppliers.ReplaceOneAsync(d => d.Id == supplier.Id, document, cancellationToken: cancellationToken);
    }
}
