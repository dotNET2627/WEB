using DentalManagement.Application.Abstractions.Services;

namespace DentalManagement.Infrastructure.Storage;

/// <summary>
/// Safe placeholder until a concrete provider (GridFS, S3, Azure Blob, etc.) is selected.
/// </summary>
public sealed class NotConfiguredFileStorage : IFileStorage
{
    public Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken) =>
        throw new NotSupportedException("No file-storage provider has been configured.");

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken) =>
        throw new NotSupportedException("No file-storage provider has been configured.");
}
