using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Prescriptions;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoPrescriptionRepository : IPrescriptionRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoPrescriptionRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Prescription?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = _sessionAccessor.Current is { } session
            ? await _context.Prescriptions.Find(session, d => d.Id == id).FirstOrDefaultAsync(cancellationToken)
            : await _context.Prescriptions.Find(d => d.Id == id).FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : PrescriptionDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<Prescription>> ListByClinicAsync(
        Guid clinicId,
        Guid? patientId,
        PrescriptionStatus? status,
        CancellationToken cancellationToken)
    {
        var builder = Builders<PrescriptionDocument>.Filter;
        var filter = builder.Eq(d => d.ClinicId, clinicId);

        if (patientId is not null)
        {
            filter &= builder.Eq(d => d.PatientId, patientId.Value);
        }

        if (status is not null)
        {
            filter &= builder.Eq(d => d.Status, status.Value.ToString());
        }

        var documents = await _context.Prescriptions
            .Find(filter)
            .SortByDescending(d => d.CreatedAt)
            .Limit(200)
            .ToListAsync(cancellationToken);

        return documents.Select(PrescriptionDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(Prescription prescription, CancellationToken cancellationToken)
    {
        var document = PrescriptionDocumentMapper.ToDocument(prescription);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Prescriptions.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Prescriptions.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(Prescription prescription, CancellationToken cancellationToken)
    {
        var document = PrescriptionDocumentMapper.ToDocument(prescription);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Prescriptions.ReplaceOneAsync(session, d => d.Id == prescription.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Prescriptions.ReplaceOneAsync(d => d.Id == prescription.Id, document, cancellationToken: cancellationToken);
    }
}
