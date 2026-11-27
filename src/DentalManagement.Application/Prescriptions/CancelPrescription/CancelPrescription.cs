using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using FluentValidation;

namespace DentalManagement.Application.Prescriptions.CancelPrescription;

public sealed record CancelPrescriptionCommand(Guid PrescriptionId, Guid ClinicId);

public sealed class CancelPrescriptionValidator : AbstractValidator<CancelPrescriptionCommand>
{
    public CancelPrescriptionValidator()
    {
        RuleFor(x => x.PrescriptionId).NotEmpty();
        RuleFor(x => x.ClinicId).NotEmpty();
    }
}

public sealed class CancelPrescriptionHandler : ICommandHandler<CancelPrescriptionCommand, Result>
{
    private readonly IPrescriptionRepository _prescriptionRepository;
    private readonly IClock _clock;

    public CancelPrescriptionHandler(IPrescriptionRepository prescriptionRepository, IClock clock)
    {
        _prescriptionRepository = prescriptionRepository;
        _clock = clock;
    }

    public async Task<Result> Handle(CancelPrescriptionCommand command, CancellationToken cancellationToken)
    {
        var prescription = await _prescriptionRepository.GetByIdAsync(command.PrescriptionId, cancellationToken);
        if (prescription is null || prescription.ClinicId != command.ClinicId)
        {
            return Result.Failure("prescription.not_found", "Không tìm thấy đơn thuốc thuộc phòng khám này.");
        }

        var cancelResult = prescription.Cancel(_clock.UtcNow);
        if (cancelResult.IsFailure)
        {
            return cancelResult;
        }

        await _prescriptionRepository.ReplaceAsync(prescription, cancellationToken);
        return Result.Success();
    }
}
