using DentalManagement.Domain.Common;
using DentalManagement.Domain.Patients;

namespace DentalManagement.Domain.MedicalImages;

/// <summary>Category of a stored medical image.</summary>
public enum MedicalImageType
{
    XRay,
    Intraoral,
    Extraoral
}

/// <summary>JSON token mapping for <see cref="MedicalImageType"/>.</summary>
public static class MedicalImageTypeExtensions
{
    public static string ToToken(this MedicalImageType type) => type switch
    {
        MedicalImageType.XRay => "xray",
        MedicalImageType.Intraoral => "intraoral",
        MedicalImageType.Extraoral => "extraoral",
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unknown medical image type.")
    };

    public static bool TryParse(string? token, out MedicalImageType type)
    {
        type = default;
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        switch (token.Trim().ToLowerInvariant().Replace("-", string.Empty).Replace("_", string.Empty))
        {
            case "xray":
                type = MedicalImageType.XRay;
                return true;
            case "intraoral":
                type = MedicalImageType.Intraoral;
                return true;
            case "extraoral":
                type = MedicalImageType.Extraoral;
                return true;
            default:
                return false;
        }
    }
}

/// <summary>
/// Medical image (X-Ray, intraoral or extraoral photo) belonging to a patient.
/// The binary content lives in <c>IFileStorage</c>; this entity keeps the metadata.
/// </summary>
public sealed class MedicalImage : AuditableEntity
{
    public MedicalImage(
        Guid id,
        Guid clinicId,
        Guid patientId,
        MedicalImageType type,
        string title,
        string storageKey,
        string fileName,
        string contentType,
        long fileSizeBytes,
        int? toothNumber = null,
        string? notes = null,
        DateTimeOffset? capturedAt = null,
        string? uploadedBy = null,
        string? comparisonRole = null)
        : base(id)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("Clinic id is required.", nameof(clinicId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("Patient id is required.", nameof(patientId));
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Image title is required.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(storageKey))
        {
            throw new ArgumentException("Storage key is required.", nameof(storageKey));
        }

        if (fileSizeBytes < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(fileSizeBytes),
                fileSizeBytes,
                "File size cannot be negative.");
        }

        if (toothNumber is { } number && !ToothCondition.IsValidToothNumber(number))
        {
            throw new ArgumentOutOfRangeException(
                nameof(toothNumber),
                toothNumber,
                "Tooth number must be valid FDI notation (11-48 permanent, 51-85 primary).");
        }

        ClinicId = clinicId;
        PatientId = patientId;
        Type = type;
        Title = title.Trim();
        StorageKey = storageKey;
        FileName = string.IsNullOrWhiteSpace(fileName) ? storageKey : fileName.Trim();
        ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim();
        FileSizeBytes = fileSizeBytes;
        ToothNumber = toothNumber;
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        CapturedAt = capturedAt;
        UploadedBy = string.IsNullOrWhiteSpace(uploadedBy) ? null : uploadedBy.Trim();
        ComparisonRole = comparisonRole;
    }

    public Guid ClinicId { get; }
    public Guid PatientId { get; }
    public MedicalImageType Type { get; }
    public string Title { get; }

    /// <summary>Key returned by <c>IFileStorage</c>; identifies the stored binary file.</summary>
    public string StorageKey { get; }

    /// <summary>Original file name supplied by the client (for display only).</summary>
    public string FileName { get; }

    public string ContentType { get; }
    public long FileSizeBytes { get; }
    public int? ToothNumber { get; }
    public string? Notes { get; }

    /// <summary>Date the image was captured, when provided by the client.</summary>
    public DateTimeOffset? CapturedAt { get; }

    public string? UploadedBy { get; }
    public string? ComparisonRole { get; }
}
