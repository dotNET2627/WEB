using FluentValidation;

namespace DentalManagement.Application.Catalog.Commands.CreateDentalService;

public sealed class CreateDentalServiceCommandValidator : AbstractValidator<CreateDentalServiceCommand>
{
    public CreateDentalServiceCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã dịch vụ không được để trống.")
            .MaximumLength(50).WithMessage("Mã dịch vụ tối đa 50 ký tự.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên dịch vụ không được để trống.")
            .MaximumLength(255).WithMessage("Tên dịch vụ tối đa 255 ký tự.");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Đơn giá không được âm.");

        When(x => x.EstimatedDurationMinutes.HasValue, () =>
        {
            RuleFor(x => x.EstimatedDurationMinutes!.Value)
                .GreaterThan(0).WithMessage("Thời gian thực hiện ước tính phải lớn hơn 0 phút.");
        });
    }
}
