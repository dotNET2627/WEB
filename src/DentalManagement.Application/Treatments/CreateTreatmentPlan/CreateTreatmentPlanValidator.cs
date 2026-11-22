using FluentValidation;

namespace DentalManagement.Application.Treatments.CreateTreatmentPlan;

public sealed class CreateTreatmentPlanValidator : AbstractValidator<CreateTreatmentPlanCommand>
{
    public CreateTreatmentPlanValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty()
            .WithMessage("Mã bệnh nhân không được để trống.");

        RuleFor(x => x.ClinicId)
            .NotEmpty()
            .WithMessage("Mã phòng khám không được để trống.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Tên phác đồ điều trị không được để trống.")
            .MaximumLength(200)
            .WithMessage("Tên phác đồ không được vượt quá 200 ký tự.");

        RuleFor(x => x.EstimatedCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Chi phí dự kiến không được là số âm.");

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("Ngày kết thúc dự kiến phải sau ngày bắt đầu.")
            .When(x => x.EndDate.HasValue);
    }
}
