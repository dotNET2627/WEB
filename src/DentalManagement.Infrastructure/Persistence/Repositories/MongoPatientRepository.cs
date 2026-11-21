using System.Text.RegularExpressions;
using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Patients;
using DentalManagement.Domain.Patients;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoPatientRepository(
    MongoDatabaseContext context, MongoSessionAccessor sessionAccessor) : IPatientRepository
{
    private static FilterDefinition<PatientDocument> Active(Guid clinicId) =>
        Builders<PatientDocument>.Filter.Eq(x => x.ClinicId, clinicId) &
        Builders<PatientDocument>.Filter.Ne(x => x.IsDeleted, true);

    public async Task<Patient?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await context.Patients.Find(x => x.Id == id && x.IsDeleted != true)
            .FirstOrDefaultAsync(cancellationToken);
        return document is null ? null : PatientDocumentMapper.ToDomain(document);
    }

    public async Task<Patient?> GetByIdAsync(Guid clinicId, Guid id, CancellationToken cancellationToken)
    {
        var document = await context.Patients.Find(Active(clinicId) &
            Builders<PatientDocument>.Filter.Eq(x => x.Id, id)).FirstOrDefaultAsync(cancellationToken);
        return document is null ? null : PatientDocumentMapper.ToDomain(document);
    }

    public async Task<PagedResult<Patient>> GetPageAsync(
        Guid clinicId, PagedQuery paging, string? search, CancellationToken cancellationToken)
    {
        var filter = Active(clinicId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            // Treat input as literal text, not as a client-supplied regular expression.
            var pattern = new BsonRegularExpression(Regex.Escape(search.Trim()), "i");
            var builder = Builders<PatientDocument>.Filter;
            filter &= builder.Regex(x => x.FullName, pattern) |
                      builder.Regex(x => x.PatientCode, pattern) |
                      builder.Regex(x => x.PhoneNumber, pattern);
        }
        var page = paging.NormalizedPage;
        var size = paging.NormalizedPageSize;
        var skip = checked((page - 1) * size);
        var total = await context.Patients.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
        var documents = await context.Patients.Find(filter)
            .SortByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
            .Skip(skip).Limit(size).ToListAsync(cancellationToken);
        return new PagedResult<Patient>(documents.Select(PatientDocumentMapper.ToDomain).ToArray(), page, size, total);
    }

    // Deleted records retain their codes to avoid reassigning an existing medical identity.
    public Task<bool> PatientCodeExistsAsync(Guid clinicId, string patientCode, CancellationToken cancellationToken) =>
        context.Patients.Find(x => x.ClinicId == clinicId && x.PatientCode == patientCode.Trim())
            .AnyAsync(cancellationToken);

    public async Task AddAsync(Patient patient, CancellationToken cancellationToken)
    {
        var document = PatientDocumentMapper.ToDocument(patient);
        try
        {
            if (sessionAccessor.Current is { } session)
                await context.Patients.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            else
                await context.Patients.InsertOneAsync(document, cancellationToken: cancellationToken);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            throw new DuplicatePatientCodeException(ex);
        }
    }

    public async Task<bool> UpdateProfileAsync(Patient patient, CancellationToken cancellationToken)
    {
        // Update only profile fields, preserving medical history, createdAt and deletion state.
        var filter = Active(patient.ClinicId) & Builders<PatientDocument>.Filter.Eq(x => x.Id, patient.Id);
        var update = Builders<PatientDocument>.Update
            .Set(x => x.FullName, patient.FullName)
            .Set(x => x.PatientCode, patient.PatientCode)
            .Set(x => x.PhoneNumber, patient.PhoneNumber)
            .Set(x => x.DateOfBirth, patient.DateOfBirth)
            .Set(x => x.UpdatedAt, patient.UpdatedAt);
        try
        {
            var result = sessionAccessor.Current is { } session
                ? await context.Patients.UpdateOneAsync(session, filter, update, cancellationToken: cancellationToken)
                : await context.Patients.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
            return result.MatchedCount > 0;
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            throw new DuplicatePatientCodeException(ex);
        }
    }

    public async Task<bool> SoftDeleteAsync(Guid clinicId, Guid id, CancellationToken cancellationToken)
    {
        var filter = Active(clinicId) & Builders<PatientDocument>.Filter.Eq(x => x.Id, id);
        var update = Builders<PatientDocument>.Update.Set(x => x.IsDeleted, true)
            .Set(x => x.UpdatedAt, DateTimeOffset.UtcNow);
        var result = sessionAccessor.Current is { } session
            ? await context.Patients.UpdateOneAsync(session, filter, update, cancellationToken: cancellationToken)
            : await context.Patients.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.MatchedCount > 0;
    }

    public async Task ReplaceAsync(Patient patient, CancellationToken cancellationToken)
    {
        var document = PatientDocumentMapper.ToDocument(patient);
        var filter = Active(patient.ClinicId) & Builders<PatientDocument>.Filter.Eq(x => x.Id, patient.Id);
        if (sessionAccessor.Current is { } session)
            await context.Patients.ReplaceOneAsync(session, filter, document, cancellationToken: cancellationToken);
        else
            await context.Patients.ReplaceOneAsync(filter, document, cancellationToken: cancellationToken);
    }
}
