using DentalManagement.Domain.Promotions;

namespace DentalManagement.Application.Promotions.Common;

public sealed record DiscountPromoDto(
    Guid Id,
    string Code,
    string Title,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscountAmount,
    decimal? MinOrderAmount,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    int? UsageLimit,
    int UsedCount,
    DiscountScope Scope,
    IReadOnlyCollection<Guid> ApplicableServiceIds,
    IReadOnlyCollection<Guid> ApplicableCategoryIds,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record DiscountValidationResultDto(
    bool IsValid,
    string? ErrorCode,
    string? Message,
    decimal OriginalAmount,
    decimal DiscountAmount,
    decimal FinalAmount,
    DiscountPromoDto? Promo);

public static class PromotionDtoMapper
{
    public static DiscountPromoDto ToDto(DiscountPromo promo) =>
        new(
            promo.Id,
            promo.Code,
            promo.Title,
            promo.Description,
            promo.DiscountType,
            promo.DiscountValue,
            promo.MaxDiscountAmount,
            promo.MinOrderAmount,
            promo.StartDate,
            promo.EndDate,
            promo.UsageLimit,
            promo.UsedCount,
            promo.Scope,
            promo.ApplicableServiceIds,
            promo.ApplicableCategoryIds,
            promo.IsActive,
            promo.CreatedAt,
            promo.UpdatedAt);
}
