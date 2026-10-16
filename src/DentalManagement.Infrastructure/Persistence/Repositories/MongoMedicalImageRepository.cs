using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.MedicalImages;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoMedicalImageRepository(MongoDatabaseContext context) : IMedicalImageRepository
{
    private static FilterDefinition<MedicalImageDocument> Scoped(Guid clinicId, Guid patientId, Guid id) =>
        Builders<MedicalImageDocument>.Filter.Eq(x => x.ClinicId, clinicId) &
        Builders<MedicalImageDocument>.Filter.Eq(x => x.PatientId, patientId) &
        Builders<MedicalImageDocument>.Filter.Eq(x => x.Id, id);

    public async Task<MedicalImage?> GetByIdAsync(
        Guid clinicId, Guid patientId, Guid id, CancellationToken cancellationToken)
    {
        var document = await context.MedicalImages
            .Find(Scoped(clinicId, patientId, id))
            .FirstOrDefaultAsync(cancellationToken);
        return document is null ? null : MedicalImageDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<MedicalImage>> ListByPatientAsync(
        Guid clinicId, Guid patientId, CancellationToken cancellationToken)
    {
        var filter = Builders<MedicalImageDocument>.Filter.Eq(x => x.ClinicId, clinicId) &
                     Builders<MedicalImageDocument>.Filter.Eq(x => x.PatientId, patientId);
        var documents = await context.MedicalImages.Find(filter)
            .SortByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);
        return documents.Select(MedicalImageDocumentMapper.ToDomain).ToArray();
    }

    public async Task AddAsync(MedicalImage image, CancellationToken cancellationToken)
    {
        var document = MedicalImageDocumentMapper.ToDocument(image);
        await context.MedicalImages.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task<bool> DeleteAsync(
        Guid clinicId, Guid patientId, Guid id, CancellationToken cancellationToken)
    {
        var result = await context.MedicalImages
            .DeleteOneAsync(Scoped(clinicId, patientId, id), cancellationToken);
        return result.DeletedCount > 0;
    }
}
