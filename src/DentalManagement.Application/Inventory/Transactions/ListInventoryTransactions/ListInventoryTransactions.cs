using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;

namespace DentalManagement.Application.Inventory.Transactions.ListInventoryTransactions;

public sealed record ListInventoryTransactionsQuery(
    Guid ClinicId,
    Guid? InventoryItemId = null,
    InventoryTransactionType? Type = null);

public sealed record InventoryTransactionDto(
    Guid Id,
    Guid ClinicId,
    Guid InventoryItemId,
    Guid InventoryBatchId,
    string BatchNumber,
    string Type,
    int Quantity,
    decimal UnitCost,
    string? ReferenceCode,
    string? Note,
    DateTimeOffset CreatedAt);

public sealed class ListInventoryTransactionsHandler
    : IQueryHandler<ListInventoryTransactionsQuery, Result<IReadOnlyList<InventoryTransactionDto>>>
{
    private readonly IInventoryTransactionRepository _transactionRepository;

    public ListInventoryTransactionsHandler(IInventoryTransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<Result<IReadOnlyList<InventoryTransactionDto>>> Handle(
        ListInventoryTransactionsQuery query,
        CancellationToken cancellationToken)
    {
        var transactions = await _transactionRepository.ListByClinicAsync(
            query.ClinicId,
            query.InventoryItemId,
            query.Type,
            cancellationToken);

        var result = transactions
            .Select(t => new InventoryTransactionDto(
                t.Id,
                t.ClinicId,
                t.InventoryItemId,
                t.InventoryBatchId,
                t.BatchNumber,
                t.Type.ToString(),
                t.Quantity,
                t.UnitCost,
                t.ReferenceCode,
                t.Note,
                t.CreatedAt))
            .ToList();

        return Result<IReadOnlyList<InventoryTransactionDto>>.Success(result);
    }
}
