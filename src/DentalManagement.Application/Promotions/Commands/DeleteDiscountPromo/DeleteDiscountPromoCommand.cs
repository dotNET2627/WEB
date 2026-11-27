using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Promotions.Commands.DeleteDiscountPromo;

public sealed record DeleteDiscountPromoCommand(Guid Id);

public sealed class DeleteDiscountPromoCommandHandler : ICommandHandler<DeleteDiscountPromoCommand, Result>
{
    private readonly IDiscountPromoRepository _promoRepository;

    public DeleteDiscountPromoCommandHandler(IDiscountPromoRepository promoRepository)
    {
        _promoRepository = promoRepository;
    }

    public async Task<Result> Handle(DeleteDiscountPromoCommand command, CancellationToken cancellationToken)
    {
        var promo = await _promoRepository.GetByIdAsync(command.Id, cancellationToken);
        if (promo == null)
        {
            return Result.Failure("promo.not_found", "Không tìm thấy chương trình khuyến mãi.");
        }

        await _promoRepository.DeleteAsync(command.Id, cancellationToken);
        return Result.Success();
    }
}
