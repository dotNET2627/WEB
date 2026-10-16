using DentalManagement.Api.Contracts;
using DentalManagement.Domain.Promotions;
using FluentValidation;

namespace DentalManagement.Api.Validators;

public sealed class CreateDiscountPromoRequestValidator : AbstractValidator<CreateDiscountPromoRequest>
{
    public CreateDiscountPromoRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã khuyến mãi không được để trống.")
            .MaximumLength(50).WithMessage("Mã khuyến mãi tối đa 50 ký tự.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề chương trình không được để trống.")
            .MaximumLength(255).WithMessage("Tiêu đề chương trình tối đa 255 ký tự.");

        RuleFor(x => x.DiscountValue)
            .GreaterThan(0).WithMessage("Giá trị giảm giá phải lớn hơn 0.");

        When(x => x.DiscountType == DiscountType.Percentage, () =>
        {
            RuleFor(x => x.DiscountValue)
                .LessThanOrEqualTo(100).WithMessage("Giảm giá theo phần trăm không được vượt quá 100%.");
        });

        When(x => x.MaxDiscountAmount.HasValue, () =>
        {
            RuleFor(x => x.MaxDiscountAmount!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Mức giảm tối đa không được âm.");
        });

        When(x => x.MinOrderAmount.HasValue, () =>
        {
            RuleFor(x => x.MinOrderAmount!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Giá trị đơn hàng tối thiểu không được âm.");
        });

        When(x => x.UsageLimit.HasValue, () =>
        {
            RuleFor(x => x.UsageLimit!.Value)
                .GreaterThan(0).WithMessage("Giới hạn số lượt dùng phải lớn hơn 0.");
        });

        When(x => x.EndDate.HasValue, () =>
        {
            RuleFor(x => x.EndDate!.Value)
                .GreaterThanOrEqualTo(x => x.StartDate).WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        });
    }
}

public sealed class UpdateDiscountPromoRequestValidator : AbstractValidator<UpdateDiscountPromoRequest>
{
    public UpdateDiscountPromoRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề chương trình không được để trống.")
            .MaximumLength(255).WithMessage("Tiêu đề chương trình tối đa 255 ký tự.");

        RuleFor(x => x.DiscountValue)
            .GreaterThan(0).WithMessage("Giá trị giảm giá phải lớn hơn 0.");

        When(x => x.DiscountType == DiscountType.Percentage, () =>
        {
            RuleFor(x => x.DiscountValue)
                .LessThanOrEqualTo(100).WithMessage("Giảm giá theo phần trăm không được vượt quá 100%.");
        });

        When(x => x.MaxDiscountAmount.HasValue, () =>
        {
            RuleFor(x => x.MaxDiscountAmount!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Mức giảm tối đa không được âm.");
        });

        When(x => x.MinOrderAmount.HasValue, () =>
        {
            RuleFor(x => x.MinOrderAmount!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Giá trị đơn hàng tối thiểu không được âm.");
        });

        When(x => x.UsageLimit.HasValue, () =>
        {
            RuleFor(x => x.UsageLimit!.Value)
                .GreaterThan(0).WithMessage("Giới hạn số lượt dùng phải lớn hơn 0.");
        });

        When(x => x.EndDate.HasValue, () =>
        {
            RuleFor(x => x.EndDate!.Value)
                .GreaterThanOrEqualTo(x => x.StartDate).WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        });
    }
}

public sealed class ValidateDiscountPromoRequestValidator : AbstractValidator<ValidateDiscountPromoRequest>
{
    public ValidateDiscountPromoRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã khuyến mãi không được để trống.");

        RuleFor(x => x.OrderAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Tổng giá trị đơn hàng không được âm.");
    }
}
