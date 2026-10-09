using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Promotions.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Promotions;

namespace DentalManagement.Application.Promotions.Queries.GetDiscountPromosPaged;

public sealed record GetDiscountPromosPagedQuery(
    string? SearchTerm = null,
    DiscountType? DiscountType = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20)
{
    public PagedQuery ToPagedQuery() => new(Page, PageSize);
}

public sealed class GetDiscountPromosPagedQueryHandler
    : IQueryHandler<GetDiscountPromosPagedQuery, Result<PagedResult<DiscountPromoDto>>>
{
    private readonly IDiscountPromoRepository _promoRepository;

    public GetDiscountPromosPagedQueryHandler(IDiscountPromoRepository promoRepository)
    {
        _promoRepository = promoRepository;
    }

    public async Task<Result<PagedResult<DiscountPromoDto>>> Handle(
        GetDiscountPromosPagedQuery query,
        CancellationToken cancellationToken)
    {
        var pagedResult = await _promoRepository.SearchAsync(
            query.SearchTerm,
            query.DiscountType,
            query.IsActive,
            query.ToPagedQuery(),
            cancellationToken);

        var dtos = pagedResult.Items.Select(PromotionDtoMapper.ToDto).ToList();
        var result = new PagedResult<DiscountPromoDto>(
            dtos,
            pagedResult.Page,
            pagedResult.PageSize,
            pagedResult.TotalCount);

        return Result<PagedResult<DiscountPromoDto>>.Success(result);
    }
}
