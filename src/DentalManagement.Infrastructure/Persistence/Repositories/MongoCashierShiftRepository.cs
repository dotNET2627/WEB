using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Billing;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoCashierShiftRepository : ICashierShiftRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoCashierShiftRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<CashierShift?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var doc = await _context.CashierShifts
            .Find(d => d.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
        return doc is null ? null : CashierShiftDocumentMapper.ToDomain(doc);
    }

    public async Task<CashierShift?> GetActiveShiftAsync(Guid clinicId, Guid? cashierId, CancellationToken cancellationToken)
    {
        var builder = Builders<CashierShiftDocument>.Filter;
        var filter = builder.Eq(d => d.ClinicId, clinicId) & builder.Eq(d => d.Status, ShiftStatus.Open.ToString());

        if (cashierId.HasValue)
        {
            filter &= builder.Eq(d => d.CashierId, cashierId.Value);
        }

        var doc = await _context.CashierShifts
            .Find(filter)
            .SortByDescending(d => d.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return doc is null ? null : CashierShiftDocumentMapper.ToDomain(doc);
    }

    public async Task<IReadOnlyList<CashierShift>> GetShiftsAsync(
        Guid clinicId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        Guid? cashierId,
        CancellationToken cancellationToken)
    {
        var builder = Builders<CashierShiftDocument>.Filter;
        var filter = builder.Eq(d => d.ClinicId, clinicId);

        if (from.HasValue) filter &= builder.Gte(d => d.StartedAt, from.Value);
        if (to.HasValue)   filter &= builder.Lte(d => d.StartedAt, to.Value);
        if (cashierId.HasValue) filter &= builder.Eq(d => d.CashierId, cashierId.Value);

        var docs = await _context.CashierShifts
            .Find(filter)
            .SortByDescending(d => d.StartedAt)
            .ToListAsync(cancellationToken);

        return docs.Select(CashierShiftDocumentMapper.ToDomain).ToList();
    }

    public async Task<string> GenerateNextShiftNumberAsync(Guid clinicId, CancellationToken cancellationToken)
    {
        // Pattern: CA-YYYYMMDD-NN (e.g. CA-20261118-01)
        var prefix = $"CA-{DateTime.UtcNow:yyyyMMdd}-";
        var count = await _context.CashierShifts
            .Find(d => d.ClinicId == clinicId && d.ShiftNumber.StartsWith(prefix))
            .CountDocumentsAsync(cancellationToken);
        return $"{prefix}{(count + 1):D2}";
    }

    public async Task AddAsync(CashierShift shift, CancellationToken cancellationToken)
    {
        var doc = CashierShiftDocumentMapper.ToDocument(shift);
        if (_sessionAccessor.Current is { } session)
        {
            await _context.CashierShifts.InsertOneAsync(session, doc, cancellationToken: cancellationToken);
            return;
        }
        await _context.CashierShifts.InsertOneAsync(doc, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(CashierShift shift, CancellationToken cancellationToken)
    {
        var doc = CashierShiftDocumentMapper.ToDocument(shift);
        if (_sessionAccessor.Current is { } session)
        {
            await _context.CashierShifts.ReplaceOneAsync(session, d => d.Id == shift.Id, doc, cancellationToken: cancellationToken);
            return;
        }
        await _context.CashierShifts.ReplaceOneAsync(d => d.Id == shift.Id, doc, cancellationToken: cancellationToken);
    }
}
