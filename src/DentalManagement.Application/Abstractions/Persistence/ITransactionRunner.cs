namespace DentalManagement.Application.Abstractions.Persistence;

/// <summary>
/// Runs a use case within a transaction when more than one MongoDB document changes.
/// </summary>
public interface ITransactionRunner
{
    Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken);
    Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken);

    Task RunAsync(Func<Task> action, CancellationToken cancellationToken) =>
        ExecuteAsync(_ => action(), cancellationToken);

    Task RunAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken) =>
        ExecuteAsync(action, cancellationToken);

    Task<T> RunAsync<T>(Func<Task<T>> action, CancellationToken cancellationToken) =>
        ExecuteAsync(_ => action(), cancellationToken);

    Task<T> RunAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken) =>
        ExecuteAsync(action, cancellationToken);
}
