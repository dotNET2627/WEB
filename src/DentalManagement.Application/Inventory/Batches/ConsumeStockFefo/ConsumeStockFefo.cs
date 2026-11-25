using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;
using FluentValidation;

namespace DentalManagement.Application.Inventory.Batches.ConsumeStockFefo;

public sealed record ConsumeStockFefoCommand(
    Guid ClinicId,
    Guid InventoryItemId,
    int Quantity,
    InventoryTransactionType TransactionType = InventoryTransactionType.ProcedureExport,
    string? ReferenceCode = null,
    string? Note = null);

public sealed record BatchConsumptionResultDto(
    Guid BatchId,
    string BatchNumber,
    DateOnly ExpirationDate,
    int ConsumedQuantity,
    int RemainingInBatch);

public sealed class ConsumeStockFefoValidator : AbstractValidator<ConsumeStockFefoCommand>
{
    public ConsumeStockFefoValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty();
        RuleFor(x => x.InventoryItemId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.TransactionType)
            .Must(t => t is InventoryTransactionType.ProcedureExport
                or InventoryTransactionType.Disposal
                or InventoryTransactionType.PrescriptionDispense
                or InventoryTransactionType.Adjustment)
            .WithMessage("Loại giao dịch xuất kho không hợp lệ.");
    }
}

public sealed class ConsumeStockFefoHandler : ICommandHandler<ConsumeStockFefoCommand, Result<IReadOnlyList<BatchConsumptionResultDto>>>
{
    private readonly IInventoryBatchRepository _batchRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly ITransactionRunner _transactionRunner;
    private readonly IClock _clock;

    public ConsumeStockFefoHandler(
        IInventoryBatchRepository batchRepository,
        IInventoryTransactionRepository transactionRepository,
        ITransactionRunner transactionRunner,
        IClock clock)
    {
        _batchRepository = batchRepository;
        _transactionRepository = transactionRepository;
        _transactionRunner = transactionRunner;
        _clock = clock;
    }

    public Task<Result<IReadOnlyList<BatchConsumptionResultDto>>> Handle(
        ConsumeStockFefoCommand command,
        CancellationToken cancellationToken)
    {
        return _transactionRunner.ExecuteAsync(async ct =>
        {
            var now = _clock.UtcNow;
            var today = DateOnly.FromDateTime(now.UtcDateTime);
            var availableBatches = await _batchRepository.ListAvailableFefoAsync(
                command.ClinicId,
                command.InventoryItemId,
                today,
                ct);

            var totalAvailable = availableBatches.Sum(b => b.QuantityOnHand);
            if (totalAvailable < command.Quantity)
            {
                return Result<IReadOnlyList<BatchConsumptionResultDto>>.Failure(
                    "inventory.insufficient_stock",
                    $"Tồn kho khả dụng ({totalAvailable}) không đủ để xuất {command.Quantity}.");
            }

            var remainingToConsume = command.Quantity;
            var consumedBatches = new List<BatchConsumptionResultDto>();

            foreach (var batch in availableBatches)
            {
                if (remainingToConsume == 0)
                {
                    break;
                }

                var take = Math.Min(batch.QuantityOnHand, remainingToConsume);
                var consumeResult = batch.Consume(take);
                if (consumeResult.IsFailure)
                {
                    return Result<IReadOnlyList<BatchConsumptionResultDto>>.Failure(
                        consumeResult.Error!.Code,
                        consumeResult.Error.Message);
                }

                await _batchRepository.ReplaceAsync(batch, ct);

                var txResult = InventoryTransaction.Create(
                    command.ClinicId,
                    command.InventoryItemId,
                    batch.Id,
                    batch.BatchNumber,
                    command.TransactionType,
                    take,
                    batch.UnitCost,
                    command.ReferenceCode,
                    command.Note,
                    now);

                if (txResult.IsFailure)
                {
                    return Result<IReadOnlyList<BatchConsumptionResultDto>>.Failure(
                        txResult.Error!.Code,
                        txResult.Error.Message);
                }

                await _transactionRepository.AddAsync(txResult.Value!, ct);

                consumedBatches.Add(new BatchConsumptionResultDto(
                    batch.Id,
                    batch.BatchNumber,
                    batch.ExpirationDate,
                    take,
                    batch.QuantityOnHand));

                remainingToConsume -= take;
            }

            return Result<IReadOnlyList<BatchConsumptionResultDto>>.Success(consumedBatches);
        }, cancellationToken);
    }
}
