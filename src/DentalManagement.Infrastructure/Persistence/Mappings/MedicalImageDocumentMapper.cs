using DentalManagement.Domain.MedicalImages;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class MedicalImageDocumentMapper
{
    public static MedicalImageDocument ToDocument(MedicalImage image) => new()
    {
        Id = image.Id,
        ClinicId = image.ClinicId,
        PatientId = image.PatientId,
        Type = image.Type.ToToken(),
        Title = image.Title,
        StorageKey = image.StorageKey,
        FileName = image.FileName,
        ContentType = image.ContentType,
        FileSizeBytes = image.FileSizeBytes,
        ToothNumber = image.ToothNumber,
        Notes = image.Notes,
        CapturedAt = image.CapturedAt,
        UploadedBy = image.UploadedBy,
        CreatedAt = image.CreatedAt,
        UpdatedAt = image.UpdatedAt
    };

    public static MedicalImage ToDomain(MedicalImageDocument document)
    {
        // Unknown tokens fall back to XRay so old records stay readable.
        MedicalImageTypeExtensions.TryParse(document.Type, out var type);

        var image = new MedicalImage(
            document.Id,
            document.ClinicId,
            document.PatientId,
            type,
            string.IsNullOrWhiteSpace(document.Title) ? "Ảnh y tế" : document.Title,
            document.StorageKey,
            document.FileName,
            document.ContentType,
            document.FileSizeBytes,
            document.ToothNumber,
            document.Notes,
            document.CapturedAt,
            document.UploadedBy);

        image.SetAuditDates(document.CreatedAt, document.UpdatedAt);
        return image;
    }
}
