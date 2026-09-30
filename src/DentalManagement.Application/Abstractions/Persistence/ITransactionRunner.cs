namespace DentalManagement.Application.Abstractions.Persistence;

/// <summary>
/// Runs a use case within a transaction when more than one MongoDB document changes.
/// </summary>
public interface ITransactionRunner
{
    Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken);
    Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken);
}

public static class TransactionRunnerExtensions
{
    public static Task RunAsync(
        this ITransactionRunner runner,
        Func<Task> action,
        CancellationToken cancellationToken = default) =>
        runner.ExecuteAsync(_ => action(), cancellationToken);

    public static Task<T> RunAsync<T>(
        this ITransactionRunner runner,
        Func<Task<T>> action,
        CancellationToken cancellationToken = default) =>
        runner.ExecuteAsync(_ => action(), cancellationToken);
}
