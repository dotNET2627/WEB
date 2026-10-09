using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Promotions;
using FluentValidation;

namespace DentalManagement.Application.Promotions.Commands.CreateDiscountPromo;

public sealed record CreateDiscountPromoCommand(
    string Code,
    string Title,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate = null,
    decimal? MaxDiscountAmount = null,
    decimal? MinOrderAmount = null,
    int? UsageLimit = null,
    DiscountScope Scope = DiscountScope.All,
    IEnumerable<Guid>? ApplicableServiceIds = null,
    IEnumerable<Guid>? ApplicableCategoryIds = null,
    string? Description = null,
    bool IsActive = true);

public sealed class CreateDiscountPromoCommandValidator : AbstractValidator<CreateDiscountPromoCommand>
{
    public CreateDiscountPromoCommandValidator()
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

public sealed class CreateDiscountPromoCommandHandler : ICommandHandler<CreateDiscountPromoCommand, Result<Guid>>
{
    private readonly IDiscountPromoRepository _promoRepository;

    public CreateDiscountPromoCommandHandler(IDiscountPromoRepository promoRepository)
    {
        _promoRepository = promoRepository;
    }

    public async Task<Result<Guid>> Handle(CreateDiscountPromoCommand command, CancellationToken cancellationToken)
    {
        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        var exists = await _promoRepository.PromoCodeExistsAsync(normalizedCode, null, cancellationToken);
        if (exists)
        {
            return Result<Guid>.Failure("promo.duplicate_code", $"Mã khuyến mãi '{normalizedCode}' đã tồn tại trong hệ thống.");
        }

        var promo = new DiscountPromo(
            Guid.NewGuid(),
            normalizedCode,
            command.Title,
            command.DiscountType,
            command.DiscountValue,
            command.StartDate,
            command.EndDate,
            command.MaxDiscountAmount,
            command.MinOrderAmount,
            command.UsageLimit,
            command.Scope,
            command.ApplicableServiceIds,
            command.ApplicableCategoryIds,
            command.Description,
            command.IsActive);

        await _promoRepository.AddAsync(promo, cancellationToken);
        return Result<Guid>.Success(promo.Id);
    }
}
