using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Promotions;
using FluentValidation;

namespace DentalManagement.Application.Promotions.Commands.UpdateDiscountPromo;

public sealed record UpdateDiscountPromoCommand(
    Guid Id,
    string Title,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    decimal? MaxDiscountAmount,
    decimal? MinOrderAmount,
    int? UsageLimit,
    DiscountScope Scope,
    IEnumerable<Guid>? ApplicableServiceIds,
    IEnumerable<Guid>? ApplicableCategoryIds);

public sealed class UpdateDiscountPromoCommandValidator : AbstractValidator<UpdateDiscountPromoCommand>
{
    public UpdateDiscountPromoCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Mã định danh chương trình không được để trống.");

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

public sealed class UpdateDiscountPromoCommandHandler : ICommandHandler<UpdateDiscountPromoCommand, Result>
{
    private readonly IDiscountPromoRepository _promoRepository;

    public UpdateDiscountPromoCommandHandler(IDiscountPromoRepository promoRepository)
    {
        _promoRepository = promoRepository;
    }

    public async Task<Result> Handle(UpdateDiscountPromoCommand command, CancellationToken cancellationToken)
    {
        var promo = await _promoRepository.GetByIdAsync(command.Id, cancellationToken);
        if (promo == null)
        {
            return Result.Failure("promo.not_found", "Không tìm thấy chương trình khuyến mãi.");
        }

        var updateResult = promo.UpdateDetails(
            command.Title,
            command.Description,
            command.DiscountType,
            command.DiscountValue,
            command.StartDate,
            command.EndDate,
            command.MaxDiscountAmount,
            command.MinOrderAmount,
            command.UsageLimit,
            command.Scope,
            command.ApplicableServiceIds,
            command.ApplicableCategoryIds);

        if (updateResult.IsFailure)
        {
            return updateResult;
        }

        await _promoRepository.ReplaceAsync(promo, cancellationToken);
        return Result.Success();
    }
}
