using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;
using FluentValidation;

namespace DentalManagement.Application.Inventory.Audits;

public sealed record AuditBatchStockCommand(
    Guid ClinicId,
    Guid InventoryBatchId,
    int ActualQuantity,
    string? Reason);

public sealed record AuditBatchStockResultDto(
    Guid BatchId,
    string BatchNumber,
    int PreviousQuantity,
    int ActualQuantity,
    int Delta);

public sealed class AuditBatchStockValidator : AbstractValidator<AuditBatchStockCommand>
{
    public AuditBatchStockValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty();
        RuleFor(x => x.InventoryBatchId).NotEmpty();
        RuleFor(x => x.ActualQuantity).GreaterThanOrEqualTo(0);
    }
}

public sealed class AuditBatchStockHandler : ICommandHandler<AuditBatchStockCommand, Result<AuditBatchStockResultDto>>
{
    private readonly IInventoryBatchRepository _batchRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly ITransactionRunner _transactionRunner;
    private readonly IClock _clock;

    public AuditBatchStockHandler(
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

    public Task<Result<AuditBatchStockResultDto>> Handle(
        AuditBatchStockCommand command,
        CancellationToken cancellationToken)
    {
        return _transactionRunner.ExecuteAsync(async ct =>
        {
            var batch = await _batchRepository.GetByIdAsync(command.InventoryBatchId, ct);
            if (batch is null || batch.ClinicId != command.ClinicId)
            {
                return Result<AuditBatchStockResultDto>.Failure(
                    "inventory.batch_not_found",
                    "Không tìm thấy lô hàng thuộc phòng khám này.");
            }

            var previousQty = batch.QuantityOnHand;
            var adjustResult = batch.AdjustQuantity(command.ActualQuantity);
            if (adjustResult.IsFailure)
            {
                return Result<AuditBatchStockResultDto>.Failure(
                    adjustResult.Error!.Code,
                    adjustResult.Error.Message);
            }

            var delta = adjustResult.Value;
            if (delta == 0)
            {
                return Result<AuditBatchStockResultDto>.Success(new AuditBatchStockResultDto(
                    batch.Id,
                    batch.BatchNumber,
                    previousQty,
                    command.ActualQuantity,
                    0));
            }

            await _batchRepository.ReplaceAsync(batch, ct);

            var now = _clock.UtcNow;
            var signedDelta = delta > 0 ? $"+{delta}" : delta.ToString();
            var txResult = InventoryTransaction.Create(
                command.ClinicId,
                batch.InventoryItemId,
                batch.Id,
                batch.BatchNumber,
                InventoryTransactionType.Adjustment,
                Math.Abs(delta),
                batch.UnitCost,
                "AUDIT",
                $"Kiểm kê kho ({signedDelta}): {command.Reason ?? "Cân bằng tồn kho thực tế"}",
                now);

            if (txResult.IsFailure)
            {
                return Result<AuditBatchStockResultDto>.Failure(txResult.Error!.Code, txResult.Error.Message);
            }

            await _transactionRepository.AddAsync(txResult.Value!, ct);

            return Result<AuditBatchStockResultDto>.Success(new AuditBatchStockResultDto(
                batch.Id,
                batch.BatchNumber,
                previousQty,
                command.ActualQuantity,
                delta));
        }, cancellationToken);
    }
}
