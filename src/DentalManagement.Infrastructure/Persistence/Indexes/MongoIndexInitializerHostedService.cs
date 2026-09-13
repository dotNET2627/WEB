using Microsoft.Extensions.Hosting;

namespace DentalManagement.Infrastructure.Persistence.Indexes;

/// <summary>
/// Creates MongoDB indexes at startup. MongoDB index creation is idempotent when definitions are unchanged.
/// </summary>
public sealed class MongoIndexInitializerHostedService : IHostedService
{
    private readonly MongoIndexInitializer _initializer;

    public MongoIndexInitializerHostedService(MongoIndexInitializer initializer)
    {
        _initializer = initializer;
    }

    public Task StartAsync(CancellationToken cancellationToken) => _initializer.InitializeAsync(cancellationToken);

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
