using DentalManagement.Application.Common;
using DentalManagement.Domain.Promotions;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IDiscountPromoRepository
{
    Task<DiscountPromo?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<DiscountPromo?> GetByCodeAsync(string code, CancellationToken cancellationToken);
    Task<bool> PromoCodeExistsAsync(string code, Guid? excludingId, CancellationToken cancellationToken);
    Task<PagedResult<DiscountPromo>> SearchAsync(
        string? searchTerm,
        DiscountType? discountType,
        bool? isActive,
        PagedQuery pagedQuery,
        CancellationToken cancellationToken);
    Task AddAsync(DiscountPromo promo, CancellationToken cancellationToken);
    Task ReplaceAsync(DiscountPromo promo, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
