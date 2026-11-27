using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Inventory.Batches.ConsumeStockFefo;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;
using FluentValidation;

namespace DentalManagement.Application.Prescriptions.DispensePrescription;

public sealed record DispensePrescriptionCommand(Guid PrescriptionId, Guid ClinicId);

public sealed record DispensedMedicationBatchDto(
    Guid InventoryItemId,
    string MedicationName,
    IReadOnlyList<BatchConsumptionResultDto> Batches);

public sealed record DispensePrescriptionResultDto(
    Guid PrescriptionId,
    string Code,
    DateTimeOffset DispensedAt,
    IReadOnlyList<DispensedMedicationBatchDto> DispensedItems);

public sealed class DispensePrescriptionValidator : AbstractValidator<DispensePrescriptionCommand>
{
    public DispensePrescriptionValidator()
    {
        RuleFor(x => x.PrescriptionId).NotEmpty();
        RuleFor(x => x.ClinicId).NotEmpty();
    }
}

public sealed class DispensePrescriptionHandler
    : ICommandHandler<DispensePrescriptionCommand, Result<DispensePrescriptionResultDto>>
{
    private readonly IPrescriptionRepository _prescriptionRepository;
    private readonly IInventoryBatchRepository _batchRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly ITransactionRunner _transactionRunner;
    private readonly IClock _clock;

    public DispensePrescriptionHandler(
        IPrescriptionRepository prescriptionRepository,
        IInventoryBatchRepository batchRepository,
        IInventoryTransactionRepository transactionRepository,
        ITransactionRunner transactionRunner,
        IClock clock)
    {
        _prescriptionRepository = prescriptionRepository;
        _batchRepository = batchRepository;
        _transactionRepository = transactionRepository;
        _transactionRunner = transactionRunner;
        _clock = clock;
    }

    public Task<Result<DispensePrescriptionResultDto>> Handle(
        DispensePrescriptionCommand command,
        CancellationToken cancellationToken)
    {
        return _transactionRunner.ExecuteAsync(async ct =>
        {
            var prescription = await _prescriptionRepository.GetByIdAsync(command.PrescriptionId, ct);
            if (prescription is null || prescription.ClinicId != command.ClinicId)
            {
                return Result<DispensePrescriptionResultDto>.Failure(
                    "prescription.not_found",
                    "Không tìm thấy đơn thuốc thuộc phòng khám này.");
            }

            var now = _clock.UtcNow;
            var markResult = prescription.MarkDispensed(now);
            if (markResult.IsFailure)
            {
                return Result<DispensePrescriptionResultDto>.Failure(
                    markResult.Error!.Code,
                    markResult.Error.Message);
            }

            var today = DateOnly.FromDateTime(now.UtcDateTime);
            var dispensedItems = new List<DispensedMedicationBatchDto>();

            foreach (var item in prescription.Items)
            {
                if (item.InventoryItemId is null || item.InventoryItemId == Guid.Empty)
                {
                    continue;
                }

                var itemId = item.InventoryItemId.Value;
                var availableBatches = await _batchRepository.ListAvailableFefoAsync(
                    command.ClinicId,
                    itemId,
                    today,
                    ct);

                var totalAvailable = availableBatches.Sum(b => b.QuantityOnHand);
                if (totalAvailable < item.Quantity)
                {
                    return Result<DispensePrescriptionResultDto>.Failure(
                        "inventory.insufficient_stock",
                        $"Thuốc '{item.MedicationName}' không đủ tồn kho (cần {item.Quantity}, khả dụng {totalAvailable}).");
                }

                var remainingToConsume = item.Quantity;
                var consumedForItem = new List<BatchConsumptionResultDto>();

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
                        return Result<DispensePrescriptionResultDto>.Failure(
                            consumeResult.Error!.Code,
                            consumeResult.Error.Message);
                    }

                    await _batchRepository.ReplaceAsync(batch, ct);

                    var txResult = InventoryTransaction.Create(
                        command.ClinicId,
                        itemId,
                        batch.Id,
                        batch.BatchNumber,
                        InventoryTransactionType.PrescriptionDispense,
                        take,
                        batch.UnitCost,
                        prescription.Code,
                        $"Cấp thuốc cho bệnh nhân {prescription.PatientName}",
                        now);

                    if (txResult.IsFailure)
                    {
                        return Result<DispensePrescriptionResultDto>.Failure(
                            txResult.Error!.Code,
                            txResult.Error.Message);
                    }

                    await _transactionRepository.AddAsync(txResult.Value!, ct);

                    consumedForItem.Add(new BatchConsumptionResultDto(
                        batch.Id,
                        batch.BatchNumber,
                        batch.ExpirationDate,
                        take,
                        batch.QuantityOnHand));

                    remainingToConsume -= take;
                }

                dispensedItems.Add(new DispensedMedicationBatchDto(
                    itemId,
                    item.MedicationName,
                    consumedForItem));
            }

            await _prescriptionRepository.ReplaceAsync(prescription, ct);

            return Result<DispensePrescriptionResultDto>.Success(new DispensePrescriptionResultDto(
                prescription.Id,
                prescription.Code,
                now,
                dispensedItems));
        }, cancellationToken);
    }
}
