using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Patients;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoPatientRepository : IPatientRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoPatientRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Patient?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.Patients
            .Find(document => document.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : PatientDocumentMapper.ToDomain(document);
    }

    public Task<bool> PatientCodeExistsAsync(Guid clinicId, string patientCode, CancellationToken cancellationToken) =>
        _context.Patients.Find(document => document.ClinicId == clinicId && document.PatientCode == patientCode)
            .AnyAsync(cancellationToken);

    public async Task AddAsync(Patient patient, CancellationToken cancellationToken)
    {
        var document = PatientDocumentMapper.ToDocument(patient);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Patients.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Patients.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(Patient patient, CancellationToken cancellationToken)
    {
        var document = PatientDocumentMapper.ToDocument(patient);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Patients.ReplaceOneAsync(session, current => current.Id == patient.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Patients.ReplaceOneAsync(current => current.Id == patient.Id, document, cancellationToken: cancellationToken);
    }
}
