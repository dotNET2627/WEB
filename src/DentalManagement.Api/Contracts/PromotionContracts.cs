using DentalManagement.Domain.Promotions;

namespace DentalManagement.Api.Contracts;

public sealed record CreateDiscountPromoRequest(
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

public sealed record UpdateDiscountPromoRequest(
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
    string? Description = null);

public sealed record ToggleDiscountPromoStatusRequest(bool? IsActive = null);

public sealed record ValidateDiscountPromoRequest(
    string Code,
    decimal OrderAmount,
    IReadOnlyCollection<Guid>? ServiceIds = null,
    IReadOnlyCollection<Guid>? CategoryIds = null);
