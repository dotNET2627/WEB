using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Billing;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoInvoiceRepository : IInvoiceRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoInvoiceRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var doc = await _context.Invoices
            .Find(d => d.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        return doc is null ? null : InvoiceDocumentMapper.ToDomain(doc);
    }

    public async Task<IReadOnlyList<Invoice>> GetByPatientAsync(Guid patientId, CancellationToken cancellationToken)
    {
        var docs = await _context.Invoices
            .Find(d => d.PatientId == patientId)
            .SortByDescending(d => d.IssuedAt)
            .ToListAsync(cancellationToken);
        return docs.Select(InvoiceDocumentMapper.ToDomain).ToList();
    }

    public async Task<IReadOnlyList<Invoice>> GetByClinicAsync(
        Guid clinicId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var builder = Builders<InvoiceDocument>.Filter;
        var filter = builder.Eq(d => d.ClinicId, clinicId);
        if (from.HasValue) filter &= builder.Gte(d => d.IssuedAt, from.Value);
        if (to.HasValue)   filter &= builder.Lte(d => d.IssuedAt, to.Value);

        var docs = await _context.Invoices
            .Find(filter)
            .SortByDescending(d => d.IssuedAt)
            .ToListAsync(cancellationToken);
        return docs.Select(InvoiceDocumentMapper.ToDomain).ToList();
    }

    public Task<bool> InvoiceNumberExistsAsync(Guid clinicId, string invoiceNumber, CancellationToken cancellationToken) =>
        _context.Invoices
            .Find(d => d.ClinicId == clinicId && d.InvoiceNumber == invoiceNumber)
            .AnyAsync(cancellationToken);

    public async Task<string> GenerateNextInvoiceNumberAsync(Guid clinicId, CancellationToken cancellationToken)
    {
        // Pattern: HD-YYYYMM-NNNN  (e.g. HD-202611-0023)
        var prefix = $"HD-{DateTime.UtcNow:yyyyMM}-";
        var count = await _context.Invoices
            .Find(d => d.ClinicId == clinicId && d.InvoiceNumber.StartsWith(prefix))
            .CountDocumentsAsync(cancellationToken);
        return $"{prefix}{(count + 1):D4}";
    }

    public async Task AddAsync(Invoice invoice, CancellationToken cancellationToken)
    {
        var doc = InvoiceDocumentMapper.ToDocument(invoice);
        if (_sessionAccessor.Current is { } session)
        {
            await _context.Invoices.InsertOneAsync(session, doc, cancellationToken: cancellationToken);
            return;
        }
        await _context.Invoices.InsertOneAsync(doc, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(Invoice invoice, CancellationToken cancellationToken)
    {
        var doc = InvoiceDocumentMapper.ToDocument(invoice);
        if (_sessionAccessor.Current is { } session)
        {
            await _context.Invoices.ReplaceOneAsync(session, d => d.Id == invoice.Id, doc, cancellationToken: cancellationToken);
            return;
        }
        await _context.Invoices.ReplaceOneAsync(d => d.Id == invoice.Id, doc, cancellationToken: cancellationToken);
    }
}
