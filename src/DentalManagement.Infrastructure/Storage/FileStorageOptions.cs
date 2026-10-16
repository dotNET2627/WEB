namespace DentalManagement.Infrastructure.Storage;

/// <summary>Local disk storage settings (appsettings section "Storage").</summary>
public sealed class FileStorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>
    /// Root folder for stored files. Relative paths are resolved against the content root,
    /// e.g. "storage/medical-images" → "{ContentRoot}/storage/medical-images".
    /// </summary>
    public string RootPath { get; set; } = "storage/medical-images";

    public static string ResolveRootPath(string? rootPath, string contentRootPath)
    {
        var configured = string.IsNullOrWhiteSpace(rootPath) ? "storage/medical-images" : rootPath.Trim();
        return Path.IsPathRooted(configured)
            ? Path.GetFullPath(configured)
            : Path.GetFullPath(Path.Combine(contentRootPath, configured));
    }
}
