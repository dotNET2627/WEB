using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;
using FluentValidation;

namespace DentalManagement.Application.Inventory.Batches.ReceiveInventoryBatch;

public sealed record ReceiveInventoryBatchCommand(
    Guid ClinicId,
    Guid InventoryItemId,
    string BatchNumber,
    DateOnly ExpirationDate,
    int Quantity,
    decimal UnitCost,
    string? ReferenceCode = null,
    string? Note = null);

public sealed class ReceiveInventoryBatchValidator : AbstractValidator<ReceiveInventoryBatchCommand>
{
    public ReceiveInventoryBatchValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty();
        RuleFor(x => x.InventoryItemId).NotEmpty();
        RuleFor(x => x.BatchNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.UnitCost).GreaterThanOrEqualTo(0);
    }
}

public sealed class ReceiveInventoryBatchHandler : ICommandHandler<ReceiveInventoryBatchCommand, Result<Guid>>
{
    private readonly IInventoryItemRepository _itemRepository;
    private readonly IInventoryBatchRepository _batchRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly ITransactionRunner _transactionRunner;
    private readonly IClock _clock;

    public ReceiveInventoryBatchHandler(
        IInventoryItemRepository itemRepository,
        IInventoryBatchRepository batchRepository,
        IInventoryTransactionRepository transactionRepository,
        ITransactionRunner transactionRunner,
        IClock clock)
    {
        _itemRepository = itemRepository;
        _batchRepository = batchRepository;
        _transactionRepository = transactionRepository;
        _transactionRunner = transactionRunner;
        _clock = clock;
    }

    public Task<Result<Guid>> Handle(ReceiveInventoryBatchCommand command, CancellationToken cancellationToken)
    {
        return _transactionRunner.ExecuteAsync(async ct =>
        {
            var item = await _itemRepository.GetByIdAsync(command.InventoryItemId, ct);
            if (item is null || item.ClinicId != command.ClinicId)
            {
                return Result<Guid>.Failure("inventory.item_not_found", "Không tìm thấy vật tư thuộc phòng khám này.");
            }

            var now = _clock.UtcNow;
            var batchResult = InventoryBatch.Create(
                command.ClinicId,
                command.InventoryItemId,
                command.BatchNumber,
                command.ExpirationDate,
                command.Quantity,
                command.UnitCost,
                now);

            if (batchResult.IsFailure)
            {
                return Result<Guid>.Failure(batchResult.Error!.Code, batchResult.Error.Message);
            }

            var batch = batchResult.Value!;
            await _batchRepository.AddAsync(batch, ct);

            var transactionResult = InventoryTransaction.Create(
                command.ClinicId,
                command.InventoryItemId,
                batch.Id,
                batch.BatchNumber,
                InventoryTransactionType.Import,
                command.Quantity,
                command.UnitCost,
                command.ReferenceCode,
                command.Note ?? "Nhập lô hàng mới",
                now);

            if (transactionResult.IsFailure)
            {
                return Result<Guid>.Failure(transactionResult.Error!.Code, transactionResult.Error.Message);
            }

            await _transactionRepository.AddAsync(transactionResult.Value!, ct);
            return Result<Guid>.Success(batch.Id);
        }, cancellationToken);
    }
}
