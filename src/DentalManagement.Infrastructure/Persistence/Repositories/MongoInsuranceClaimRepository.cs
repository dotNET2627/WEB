using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Insurance;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoInsuranceClaimRepository : IInsuranceClaimRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoInsuranceClaimRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<InsuranceClaim?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var find = _sessionAccessor.Current is { } session
            ? _context.InsuranceClaims.Find(session, d => d.Id == id)
            : _context.InsuranceClaims.Find(d => d.Id == id);
        var doc = await find.FirstOrDefaultAsync(cancellationToken);
        return doc is null ? null : InsuranceClaimDocumentMapper.ToDomain(doc);
    }

    public async Task<IReadOnlyList<InsuranceClaim>> GetByClinicAsync(
        Guid clinicId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        InsuranceClaimStatus? status,
        InsuranceType? insuranceType,
        Guid? patientId,
        CancellationToken cancellationToken)
    {
        var builder = Builders<InsuranceClaimDocument>.Filter;
        var filter = builder.Eq(d => d.ClinicId, clinicId);

        if (from.HasValue) filter &= builder.Gte(d => d.SubmittedAt, from.Value);
        if (to.HasValue)   filter &= builder.Lte(d => d.SubmittedAt, to.Value);
        if (status.HasValue) filter &= builder.Eq(d => d.Status, status.Value.ToString());
        if (insuranceType.HasValue) filter &= builder.Eq(d => d.InsuranceType, insuranceType.Value.ToString());
        if (patientId.HasValue) filter &= builder.Eq(d => d.PatientId, patientId.Value);

        var docs = await _context.InsuranceClaims
            .Find(filter)
            .SortByDescending(d => d.SubmittedAt)
            .ToListAsync(cancellationToken);

        return docs.Select(InsuranceClaimDocumentMapper.ToDomain).ToList();
    }

    public async Task<IReadOnlyList<InsuranceClaim>> GetByPatientAsync(Guid patientId, CancellationToken cancellationToken)
    {
        var docs = await _context.InsuranceClaims
            .Find(d => d.PatientId == patientId)
            .SortByDescending(d => d.SubmittedAt)
            .ToListAsync(cancellationToken);
        return docs.Select(InsuranceClaimDocumentMapper.ToDomain).ToList();
    }

    public async Task<string> GenerateNextClaimNumberAsync(Guid clinicId, CancellationToken cancellationToken)
    {
        // Pattern: BH-YYYYMM-NNNN (e.g. BH-202611-0001)
        var prefix = $"BH-{DateTime.UtcNow:yyyyMM}-";
        var count = await _context.InsuranceClaims
            .Find(d => d.ClinicId == clinicId && d.ClaimNumber.StartsWith(prefix))
            .CountDocumentsAsync(cancellationToken);
        return $"{prefix}{(count + 1):D4}";
    }

    public async Task AddAsync(InsuranceClaim claim, CancellationToken cancellationToken)
    {
        var doc = InsuranceClaimDocumentMapper.ToDocument(claim);
        if (_sessionAccessor.Current is { } session)
        {
            await _context.InsuranceClaims.InsertOneAsync(session, doc, cancellationToken: cancellationToken);
            return;
        }
        await _context.InsuranceClaims.InsertOneAsync(doc, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(InsuranceClaim claim, CancellationToken cancellationToken)
    {
        var doc = InsuranceClaimDocumentMapper.ToDocument(claim);
        if (_sessionAccessor.Current is { } session)
        {
            await _context.InsuranceClaims.ReplaceOneAsync(session, d => d.Id == claim.Id, doc, cancellationToken: cancellationToken);
            return;
        }
        await _context.InsuranceClaims.ReplaceOneAsync(d => d.Id == claim.Id, doc, cancellationToken: cancellationToken);
    }
}
