using DentalManagement.Domain.Promotions;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class DiscountPromoDocumentMapper
{
    public static DiscountPromoDocument ToDocument(DiscountPromo promo) => new()
    {
        Id = promo.Id,
        Code = promo.Code,
        Title = promo.Title,
        Description = promo.Description,
        DiscountType = (int)promo.DiscountType,
        DiscountValue = promo.DiscountValue,
        MaxDiscountAmount = promo.MaxDiscountAmount,
        MinOrderAmount = promo.MinOrderAmount,
        StartDate = promo.StartDate,
        EndDate = promo.EndDate,
        UsageLimit = promo.UsageLimit,
        UsedCount = promo.UsedCount,
        Scope = (int)promo.Scope,
        ApplicableServiceIds = [.. promo.ApplicableServiceIds],
        ApplicableCategoryIds = [.. promo.ApplicableCategoryIds],
        IsActive = promo.IsActive,
        CreatedAt = promo.CreatedAt,
        UpdatedAt = promo.UpdatedAt
    };

    public static DiscountPromo ToDomain(DiscountPromoDocument document) =>
        DiscountPromo.Rehydrate(
            document.Id,
            document.Code,
            document.Title,
            document.Description,
            (DiscountType)document.DiscountType,
            document.DiscountValue,
            document.MaxDiscountAmount,
            document.MinOrderAmount,
            document.StartDate,
            document.EndDate,
            document.UsageLimit,
            document.UsedCount,
            (DiscountScope)document.Scope,
            document.ApplicableServiceIds,
            document.ApplicableCategoryIds,
            document.IsActive,
            document.CreatedAt,
            document.UpdatedAt);
}
