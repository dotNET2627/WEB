using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Treatments;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoTreatmentPlanRepository : ITreatmentPlanRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoTreatmentPlanRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<TreatmentPlan?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var filter = Builders<TreatmentPlanDocument>.Filter.Eq(d => d.Id, id);

        var doc = _sessionAccessor.Current is { } session
            ? await _context.TreatmentPlans.Find(session, filter).FirstOrDefaultAsync(cancellationToken)
            : await _context.TreatmentPlans.Find(filter).FirstOrDefaultAsync(cancellationToken);

        return doc is null ? null : TreatmentPlanDocumentMapper.ToDomain(doc);
    }

    public async Task<IReadOnlyList<TreatmentPlan>> GetByPatientIdAsync(Guid clinicId, Guid patientId, CancellationToken cancellationToken)
    {
        var filter = Builders<TreatmentPlanDocument>.Filter.Where(d => d.ClinicId == clinicId && d.PatientId == patientId);

        var docs = _sessionAccessor.Current is { } session
            ? await _context.TreatmentPlans.Find(session, filter).ToListAsync(cancellationToken)
            : await _context.TreatmentPlans.Find(filter).ToListAsync(cancellationToken);

        return docs.Select(TreatmentPlanDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(TreatmentPlan plan, CancellationToken cancellationToken)
    {
        var doc = TreatmentPlanDocumentMapper.ToDocument(plan);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.TreatmentPlans.InsertOneAsync(session, doc, cancellationToken: cancellationToken);
        }
        else
        {
            await _context.TreatmentPlans.InsertOneAsync(doc, cancellationToken: cancellationToken);
        }
    }

    public async Task ReplaceAsync(TreatmentPlan plan, CancellationToken cancellationToken)
    {
        var doc = TreatmentPlanDocumentMapper.ToDocument(plan);
        var filter = Builders<TreatmentPlanDocument>.Filter.Eq(d => d.Id, plan.Id);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.TreatmentPlans.ReplaceOneAsync(session, filter, doc, cancellationToken: cancellationToken);
        }
        else
        {
            await _context.TreatmentPlans.ReplaceOneAsync(filter, doc, cancellationToken: cancellationToken);
        }
    }
}
