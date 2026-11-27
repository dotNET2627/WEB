namespace DentalManagement.Application.MedicalImages;

/// <summary>Upload constraints for medical images (X-Ray / intraoral / extraoral photos).</summary>
public static class MedicalImageLimits
{
    /// <summary>15 MB hard limit per uploaded file.</summary>
    public const long MaxFileSizeBytes = 15 * 1024 * 1024;

    public const int MaxTitleLength = 200;
    public const int MaxNotesLength = 1000;

    public static readonly IReadOnlySet<string> AllowedExtensions =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".dcm", ".dicom" };

    public static readonly IReadOnlySet<string> AllowedContentTypes =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "application/dicom",
            "application/x-dicom"
        };

    public static bool IsAllowedFileName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return false;
        }

        var extension = Path.GetExtension(fileName.Trim());
        return extension.Length > 0 && AllowedExtensions.Contains(extension);
    }

    public static bool IsAllowedContentType(string? contentType) =>
        !string.IsNullOrWhiteSpace(contentType) && AllowedContentTypes.Contains(contentType.Trim());
}
