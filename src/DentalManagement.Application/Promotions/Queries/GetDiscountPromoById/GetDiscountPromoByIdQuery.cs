using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Promotions.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Promotions.Queries.GetDiscountPromoById;

public sealed record GetDiscountPromoByIdQuery(Guid Id);

public sealed class GetDiscountPromoByIdQueryHandler
    : IQueryHandler<GetDiscountPromoByIdQuery, Result<DiscountPromoDto>>
{
    private readonly IDiscountPromoRepository _promoRepository;

    public GetDiscountPromoByIdQueryHandler(IDiscountPromoRepository promoRepository)
    {
        _promoRepository = promoRepository;
    }

    public async Task<Result<DiscountPromoDto>> Handle(
        GetDiscountPromoByIdQuery query,
        CancellationToken cancellationToken)
    {
        var promo = await _promoRepository.GetByIdAsync(query.Id, cancellationToken);
        if (promo == null)
        {
            return Result<DiscountPromoDto>.Failure("promo.not_found", "Không tìm thấy chương trình khuyến mãi.");
        }

        return Result<DiscountPromoDto>.Success(PromotionDtoMapper.ToDto(promo));
    }
}
