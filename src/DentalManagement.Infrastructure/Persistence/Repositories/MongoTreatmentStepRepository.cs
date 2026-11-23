using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Treatments;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoTreatmentStepRepository : ITreatmentStepRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoTreatmentStepRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<TreatmentStep?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var filter = Builders<TreatmentStepDocument>.Filter.Eq(d => d.Id, id);

        var doc = _sessionAccessor.Current is { } session
            ? await _context.TreatmentSteps.Find(session, filter).FirstOrDefaultAsync(cancellationToken)
            : await _context.TreatmentSteps.Find(filter).FirstOrDefaultAsync(cancellationToken);

        return doc is null ? null : TreatmentStepDocumentMapper.ToDomain(doc);
    }

    public async Task<IReadOnlyList<TreatmentStep>> GetByTreatmentPlanIdAsync(Guid treatmentPlanId, CancellationToken cancellationToken)
    {
        var filter = Builders<TreatmentStepDocument>.Filter.Eq(d => d.TreatmentPlanId, treatmentPlanId);

        var docs = _sessionAccessor.Current is { } session
            ? await _context.TreatmentSteps.Find(session, filter).ToListAsync(cancellationToken)
            : await _context.TreatmentSteps.Find(filter).ToListAsync(cancellationToken);

        return docs.Select(TreatmentStepDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(TreatmentStep step, CancellationToken cancellationToken)
    {
        var doc = TreatmentStepDocumentMapper.ToDocument(step);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.TreatmentSteps.InsertOneAsync(session, doc, cancellationToken: cancellationToken);
        }
        else
        {
            await _context.TreatmentSteps.InsertOneAsync(doc, cancellationToken: cancellationToken);
        }
    }

    public async Task UpdateAsync(TreatmentStep step, CancellationToken cancellationToken)
    {
        var doc = TreatmentStepDocumentMapper.ToDocument(step);
        var filter = Builders<TreatmentStepDocument>.Filter.Eq(d => d.Id, step.Id);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.TreatmentSteps.ReplaceOneAsync(session, filter, doc, cancellationToken: cancellationToken);
        }
        else
        {
            await _context.TreatmentSteps.ReplaceOneAsync(filter, doc, cancellationToken: cancellationToken);
        }
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var filter = Builders<TreatmentStepDocument>.Filter.Eq(d => d.Id, id);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.TreatmentSteps.DeleteOneAsync(session, filter, cancellationToken: cancellationToken);
        }
        else
        {
            await _context.TreatmentSteps.DeleteOneAsync(filter, cancellationToken: cancellationToken);
        }
    }

    public async Task UpdateOrderBatchAsync(IReadOnlyList<(Guid Id, int OrderIndex)> stepOrders, CancellationToken cancellationToken)
    {
        if (stepOrders.Count == 0) return;

        var updates = new List<WriteModel<TreatmentStepDocument>>();
        foreach (var (id, orderIndex) in stepOrders)
        {
            var filter = Builders<TreatmentStepDocument>.Filter.Eq(d => d.Id, id);
            var update = Builders<TreatmentStepDocument>.Update
                .Set(d => d.OrderIndex, orderIndex)
                .Set(d => d.UpdatedAt, DateTimeOffset.UtcNow);

            updates.Add(new UpdateOneModel<TreatmentStepDocument>(filter, update));
        }

        if (_sessionAccessor.Current is { } session)
        {
            await _context.TreatmentSteps.BulkWriteAsync(session, updates, cancellationToken: cancellationToken);
        }
        else
        {
            await _context.TreatmentSteps.BulkWriteAsync(updates, cancellationToken: cancellationToken);
        }
    }
}
