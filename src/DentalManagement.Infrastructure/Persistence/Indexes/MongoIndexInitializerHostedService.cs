using Microsoft.Extensions.Hosting;

namespace DentalManagement.Infrastructure.Persistence.Indexes;

/// <summary>
/// Creates MongoDB indexes at startup. MongoDB index creation is idempotent when definitions are unchanged.
/// </summary>
public sealed class MongoIndexInitializerHostedService : IHostedService
{
    private readonly MongoIndexInitializer _initializer;
    private const int MaxRetryAttempts = 5;
    private const int BaseDelayMilliseconds = 1000;

    public MongoIndexInitializerHostedService(MongoIndexInitializer initializer)
    {
        _initializer = initializer;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        int retryAttempt = 0;
        while (retryAttempt < MaxRetryAttempts)
        {
            try
            {
                await _initializer.InitializeAsync(cancellationToken);
                return; // Success
            }
            catch (Exception) when (!cancellationToken.IsCancellationRequested)
            {
                retryAttempt++;
                if (retryAttempt >= MaxRetryAttempts)
                {
                    // Log the final attempt failure and rethrow
                    throw;
                }

                // Exponential backoff with jitter
                int delay = BaseDelayMilliseconds * (int)Math.Pow(2, retryAttempt - 1) +
                    new Random().Next(0, 500);
                await Task.Delay(delay, cancellationToken);
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
