using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Infrastructure.Persistence;

namespace DentalManagement.Infrastructure.Transactions;

public sealed class MongoTransactionRunner : ITransactionRunner
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoTransactionRunner(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken) =>
        ExecuteAsync(async token =>
        {
            await action(token);
            return true;
        }, cancellationToken);

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken)
    {
        using var session = await _context.Client.StartSessionAsync(cancellationToken: cancellationToken);
        _sessionAccessor.Current = session;

        try
        {
            return await session.WithTransactionAsync((_, token) => action(token), cancellationToken: cancellationToken);
        }
        finally
        {
            _sessionAccessor.Current = null;
        }
    }
}
