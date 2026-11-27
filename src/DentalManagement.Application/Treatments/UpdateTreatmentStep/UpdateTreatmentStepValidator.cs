using FluentValidation;

namespace DentalManagement.Application.Treatments.UpdateTreatmentStep;

public sealed class UpdateTreatmentStepValidator : AbstractValidator<UpdateTreatmentStepCommand>
{
    public UpdateTreatmentStepValidator()
    {
        RuleFor(x => x.StepId)
            .NotEmpty().WithMessage("Mã hạng mục điều trị không được để trống.");

        RuleFor(x => x.StepName)
            .NotEmpty().WithMessage("Tên hạng mục điều trị không được để trống.")
            .MaximumLength(200).WithMessage("Tên hạng mục điều trị không được vượt quá 200 ký tự.");

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("Chi phí không được là số âm.");

        RuleFor(x => x.ToothNumber)
            .MaximumLength(50).WithMessage("Vị trí răng không được vượt quá 50 ký tự.");
    }
}
