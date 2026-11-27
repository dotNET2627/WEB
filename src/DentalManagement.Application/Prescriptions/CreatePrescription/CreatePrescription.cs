using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Prescriptions;
using FluentValidation;

namespace DentalManagement.Application.Prescriptions.CreatePrescription;

public sealed record CreatePrescriptionItemInput(
    Guid? InventoryItemId,
    string MedicationName,
    string Dosage,
    int Quantity,
    string Unit,
    string Instructions);

public sealed record CreatePrescriptionCommand(
    Guid ClinicId,
    string? Code,
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    Guid? DoctorId,
    string DoctorName,
    string Diagnosis,
    string? MedicalNotes,
    bool IsDraft,
    IReadOnlyList<CreatePrescriptionItemInput> Items);

public sealed class CreatePrescriptionValidator : AbstractValidator<CreatePrescriptionCommand>
{
    public CreatePrescriptionValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty();
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.PatientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Diagnosis).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.MedicationName).NotEmpty().MaximumLength(200);
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.Unit).NotEmpty().MaximumLength(50);
        });
    }
}

public sealed class CreatePrescriptionHandler : ICommandHandler<CreatePrescriptionCommand, Result<Guid>>
{
    private readonly IPrescriptionRepository _prescriptionRepository;
    private readonly IClock _clock;

    public CreatePrescriptionHandler(IPrescriptionRepository prescriptionRepository, IClock clock)
    {
        _prescriptionRepository = prescriptionRepository;
        _clock = clock;
    }

    public async Task<Result<Guid>> Handle(CreatePrescriptionCommand command, CancellationToken cancellationToken)
    {
        var items = command.Items
            .Select(i => new PrescriptionItem(
                i.InventoryItemId,
                i.MedicationName.Trim(),
                i.Dosage?.Trim() ?? string.Empty,
                i.Quantity,
                i.Unit.Trim(),
                i.Instructions?.Trim() ?? string.Empty))
            .ToList();

        var result = Prescription.Create(
            command.ClinicId,
            command.Code,
            command.PatientId,
            command.PatientName,
            command.PatientCode,
            command.DoctorId,
            command.DoctorName,
            command.Diagnosis,
            command.MedicalNotes,
            command.IsDraft,
            items,
            _clock.UtcNow);

        if (result.IsFailure)
        {
            return Result<Guid>.Failure(result.Error!.Code, result.Error.Message);
        }

        await _prescriptionRepository.AddAsync(result.Value!, cancellationToken);
        return Result<Guid>.Success(result.Value!.Id);
    }
}
