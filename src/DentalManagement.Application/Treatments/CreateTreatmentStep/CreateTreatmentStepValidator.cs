using FluentValidation;

namespace DentalManagement.Application.Treatments.CreateTreatmentStep;

public sealed class CreateTreatmentStepValidator : AbstractValidator<CreateTreatmentStepCommand>
{
    public CreateTreatmentStepValidator()
    {
        RuleFor(x => x.TreatmentPlanId)
            .NotEmpty().WithMessage("Mã phác đồ điều trị không được để trống.");

        RuleFor(x => x.ClinicId)
            .NotEmpty().WithMessage("Mã phòng khám không được để trống.");

        RuleFor(x => x.StepName)
            .NotEmpty().WithMessage("Tên hạng mục điều trị không được để trống.")
            .MaximumLength(200).WithMessage("Tên hạng mục điều trị không được vượt quá 200 ký tự.");

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("Chi phí không được là số âm.");

        RuleFor(x => x.ToothNumber)
            .MaximumLength(50).WithMessage("Vị trí răng không được vượt quá 50 ký tự.");
    }
}
