using DentalManagement.Application.Abstractions.Services;

namespace DentalManagement.Application.Tests.Fakes;

/// <summary>In-memory <see cref="IFileStorage"/> for unit tests.</summary>
internal sealed class FakeFileStorage : IFileStorage
{
    public Dictionary<string, StoredFile> Files { get; } = new();
    public List<string> DeletedKeys { get; } = [];
    public bool ThrowOnDelete { get; set; }

    public async Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var key = $"{Guid.NewGuid():N}{extension}";
        Files[key] = new StoredFile(fileName, contentType, buffer.ToArray());
        return key;
    }

    public Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken) =>
        Task.FromResult<Stream?>(Files.TryGetValue(storageKey, out var file) ? new MemoryStream(file.Content) : null);

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        if (ThrowOnDelete)
        {
            throw new InvalidOperationException("Storage is unavailable.");
        }

        DeletedKeys.Add(storageKey);
        Files.Remove(storageKey);
        return Task.CompletedTask;
    }

    internal sealed record StoredFile(string FileName, string ContentType, byte[] Content);
}
