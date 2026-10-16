using DentalManagement.Application.Abstractions.Services;

namespace DentalManagement.Infrastructure.Storage;

/// <summary>
/// Stores binary files on the local disk under a single configured root directory.
/// The returned storage key is a generated file name (never client-controlled paths)
/// and is safe to hand back to <see cref="DeleteAsync"/>.
/// </summary>
public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public LocalFileStorage(string rootPath)
    {
        if (string.IsNullOrWhiteSpace(rootPath))
        {
            throw new ArgumentException("Storage root path is required.", nameof(rootPath));
        }

        _rootPath = Path.GetFullPath(rootPath);
        Directory.CreateDirectory(_rootPath);
    }

    internal string RootPath => _rootPath;

    public async Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(content);

        var extension = Path.GetExtension(fileName ?? string.Empty).Trim().ToLowerInvariant();
        var storageKey = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Resolve(storageKey);

        await using var target = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await content.CopyToAsync(target, cancellationToken);
        return storageKey;
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        var fullPath = Resolve(storageKey);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    /// <summary>Maps a storage key onto the root directory, rejecting traversal attempts.</summary>
    private string Resolve(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
        {
            throw new ArgumentException("Storage key is required.", nameof(storageKey));
        }

        var normalized = storageKey.Replace('\\', '/').TrimStart('/');
        if (normalized.Contains("..", StringComparison.Ordinal) ||
            normalized.Contains('/') ||
            normalized.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            throw new InvalidOperationException($"Invalid storage key '{storageKey}'.");
        }

        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, normalized));
        if (!fullPath.StartsWith(_rootPath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) &&
            !fullPath.StartsWith(_rootPath + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Invalid storage key '{storageKey}'.");
        }

        return fullPath;
    }
}
