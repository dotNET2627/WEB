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

    public async Task<IReadOnlyList<Patient>> GetByIdsAsync(
        Guid clinicId,
        IEnumerable<Guid> ids,
        CancellationToken cancellationToken)
    {
        var idList = ids.ToList();
        if (idList.Count == 0) return [];

        var filter = Active(clinicId) & Builders<PatientDocument>.Filter.In(d => d.Id, idList);
        var documents = await context.Patients.Find(filter).ToListAsync(cancellationToken);
        return documents.Select(PatientDocumentMapper.ToDomain).ToList();
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

    public async Task<bool> UpdateMedicalHistoryAsync(Patient patient, CancellationToken cancellationToken)
    {
        var filter = Active(patient.ClinicId) & Builders<PatientDocument>.Filter.Eq(x => x.Id, patient.Id);

        var current = sessionAccessor.Current is { } getSession
            ? await context.Patients.Find(getSession, filter).FirstOrDefaultAsync(cancellationToken)
            : await context.Patients.Find(filter).FirstOrDefaultAsync(cancellationToken);

        if (current is null)
            return false;

        var currentHistory = current.MedicalHistory ?? [];
        var targetHistory = patient.MedicalHistory;

        // If an item was appended (AddMedicalHistory): perform atomic $push without risking overwriting other items
        if (targetHistory.Count == currentHistory.Count + 1)
        {
            var newItem = targetHistory.Last();
            var doc = new MedicalHistoryDocument(newItem.Type, newItem.Name, newItem.Severity, newItem.Note, newItem.UpdatedAt);
            var pushUpdate = Builders<PatientDocument>.Update
                .Push(x => x.MedicalHistory, doc)
                .Set(x => x.UpdatedAt, newItem.UpdatedAt);

            var result = sessionAccessor.Current is { } pushSession
                ? await context.Patients.UpdateOneAsync(pushSession, filter, pushUpdate, cancellationToken: cancellationToken)
                : await context.Patients.UpdateOneAsync(filter, pushUpdate, cancellationToken: cancellationToken);

            return result.MatchedCount > 0;
        }

        // For item removals or updates: use optimistic concurrency control based on UpdatedAt
        var history = targetHistory
            .Select(item => new MedicalHistoryDocument(item.Type, item.Name, item.Severity, item.Note, item.UpdatedAt))
            .ToArray();
        var update = Builders<PatientDocument>.Update
            .Set(x => x.MedicalHistory, history)
            .Set(x => x.UpdatedAt, DateTimeOffset.UtcNow);

        var occFilter = filter & Builders<PatientDocument>.Filter.Eq(x => x.UpdatedAt, current.UpdatedAt);

        var occResult = sessionAccessor.Current is { } occSession
            ? await context.Patients.UpdateOneAsync(occSession, occFilter, update, cancellationToken: cancellationToken)
            : await context.Patients.UpdateOneAsync(occFilter, update, cancellationToken: cancellationToken);

        if (occResult.MatchedCount > 0)
            return true;

        var fallbackResult = sessionAccessor.Current is { } historySession
            ? await context.Patients.UpdateOneAsync(historySession, filter, update, cancellationToken: cancellationToken)
            : await context.Patients.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);

        return fallbackResult.MatchedCount > 0;
    }

    public async Task<bool> UpdateOdontogramAsync(Patient patient, CancellationToken cancellationToken)
    {
        var filter = Active(patient.ClinicId) & Builders<PatientDocument>.Filter.Eq(x => x.Id, patient.Id);

        var current = sessionAccessor.Current is { } getSession
            ? await context.Patients.Find(getSession, filter).FirstOrDefaultAsync(cancellationToken)
            : await context.Patients.Find(filter).FirstOrDefaultAsync(cancellationToken);

        if (current is null)
            return false;

        var currentTeeth = current.Teeth ?? [];
        var targetTeeth = patient.Teeth;

        var currentMap = currentTeeth.ToDictionary(t => t.ToothNumber);
        var targetMap = targetTeeth.ToDictionary(t => t.ToothNumber);

        // Identify only teeth that were removed, added, or modified
        var removedToothNumbers = currentMap.Keys.Where(k => !targetMap.ContainsKey(k)).ToList();
        var upsertedTeeth = targetMap.Values.Where(t =>
        {
            if (!currentMap.TryGetValue(t.ToothNumber, out var existing))
                return true;

            return existing.Condition != t.Condition.ToToken()
                || existing.Note != t.Note
                || existing.UpdatedBy != t.UpdatedBy
                || !existing.Surfaces.SequenceEqual(t.Surfaces.Select(s => s.ToToken()));
        }).ToList();

        // If no teeth changed, return success (idempotent)
        if (removedToothNumbers.Count == 0 && upsertedTeeth.Count == 0)
            return true;

        var updatedAt = DateTimeOffset.UtcNow;

        // Atomic array removal for removed teeth (marked healthy)
        foreach (var toothNumber in removedToothNumbers)
        {
            var pullUpdate = Builders<PatientDocument>.Update
                .PullFilter(x => x.Teeth, t => t.ToothNumber == toothNumber)
                .Set(x => x.UpdatedAt, updatedAt);

            if (sessionAccessor.Current is { } session)
                await context.Patients.UpdateOneAsync(session, filter, pullUpdate, cancellationToken: cancellationToken);
            else
                await context.Patients.UpdateOneAsync(filter, pullUpdate, cancellationToken: cancellationToken);
        }

        // Atomic array upsert for modified/added teeth without touching untouched teeth
        foreach (var tooth in upsertedTeeth)
        {
            var toothDoc = new ToothConditionDocument(
                tooth.ToothNumber,
                tooth.Condition.ToToken(),
                tooth.Surfaces.Select(surface => surface.ToToken()).ToArray(),
                tooth.Note,
                tooth.UpdatedAt,
                tooth.UpdatedBy);

            var pullExisting = Builders<PatientDocument>.Update.PullFilter(x => x.Teeth, t => t.ToothNumber == tooth.ToothNumber);
            var pushNew = Builders<PatientDocument>.Update
                .Push(x => x.Teeth, toothDoc)
                .Set(x => x.UpdatedAt, updatedAt);

            if (sessionAccessor.Current is { } session)
            {
                await context.Patients.UpdateOneAsync(session, filter, pullExisting, cancellationToken: cancellationToken);
                await context.Patients.UpdateOneAsync(session, filter, pushNew, cancellationToken: cancellationToken);
            }
            else
            {
                await context.Patients.UpdateOneAsync(filter, pullExisting, cancellationToken: cancellationToken);
                await context.Patients.UpdateOneAsync(filter, pushNew, cancellationToken: cancellationToken);
            }
        }

        return true;
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
