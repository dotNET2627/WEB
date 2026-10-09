using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Promotions.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Promotions.Queries.ValidateDiscountPromo;

public sealed record ValidateDiscountPromoQuery(
    string Code,
    decimal OrderAmount,
    IReadOnlyCollection<Guid>? ServiceIds = null,
    IReadOnlyCollection<Guid>? CategoryIds = null);

public sealed class ValidateDiscountPromoQueryHandler
    : IQueryHandler<ValidateDiscountPromoQuery, Result<DiscountValidationResultDto>>
{
    private readonly IDiscountPromoRepository _promoRepository;

    public ValidateDiscountPromoQueryHandler(IDiscountPromoRepository promoRepository)
    {
        _promoRepository = promoRepository;
    }

    public async Task<Result<DiscountValidationResultDto>> Handle(
        ValidateDiscountPromoQuery query,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query.Code))
        {
            return Result<DiscountValidationResultDto>.Success(new DiscountValidationResultDto(
                IsValid: false,
                ErrorCode: "promo.empty_code",
                Message: "Mã khuyến mãi không được để trống.",
                OriginalAmount: query.OrderAmount,
                DiscountAmount: 0m,
                FinalAmount: query.OrderAmount,
                Promo: null));
        }

        var normalizedCode = query.Code.Trim().ToUpperInvariant();
        var promo = await _promoRepository.GetByCodeAsync(normalizedCode, cancellationToken);

        if (promo == null)
        {
            return Result<DiscountValidationResultDto>.Success(new DiscountValidationResultDto(
                IsValid: false,
                ErrorCode: "promo.not_found",
                Message: $"Mã khuyến mãi '{normalizedCode}' không tồn tại.",
                OriginalAmount: query.OrderAmount,
                DiscountAmount: 0m,
                FinalAmount: query.OrderAmount,
                Promo: null));
        }

        var canApplyResult = promo.CanApply(
            query.OrderAmount,
            query.ServiceIds,
            query.CategoryIds,
            DateTimeOffset.UtcNow);

        if (canApplyResult.IsFailure)
        {
            return Result<DiscountValidationResultDto>.Success(new DiscountValidationResultDto(
                IsValid: false,
                ErrorCode: canApplyResult.Error!.Code,
                Message: canApplyResult.Error.Message,
                OriginalAmount: query.OrderAmount,
                DiscountAmount: 0m,
                FinalAmount: query.OrderAmount,
                Promo: PromotionDtoMapper.ToDto(promo)));
        }

        var discountAmount = promo.CalculateDiscount(query.OrderAmount);
        var finalAmount = Math.Max(0m, query.OrderAmount - discountAmount);

        return Result<DiscountValidationResultDto>.Success(new DiscountValidationResultDto(
            IsValid: true,
            ErrorCode: null,
            Message: "Mã khuyến mãi hợp lệ và đã được áp dụng thành công.",
            OriginalAmount: query.OrderAmount,
            DiscountAmount: discountAmount,
            FinalAmount: finalAmount,
            Promo: PromotionDtoMapper.ToDto(promo)));
    }
}
