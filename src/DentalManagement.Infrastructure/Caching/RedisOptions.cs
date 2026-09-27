namespace DentalManagement.Infrastructure.Caching;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    /// <summary>StackExchange.Redis connection string, e.g. "localhost:6379,password=secret"</summary>
    public string ConnectionString { get; init; } = string.Empty;

    /// <summary>Key prefix applied to every cache entry, e.g. "dental:"</summary>
    public string InstanceName { get; init; } = "dental:";
}
