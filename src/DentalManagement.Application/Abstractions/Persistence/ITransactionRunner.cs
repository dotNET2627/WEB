namespace DentalManagement.Application.Abstractions.Persistence;

/// <summary>
/// Runs a use case within a transaction when more than one MongoDB document changes.
/// </summary>
public interface ITransactionRunner
{
    Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken);
    Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken);
}
