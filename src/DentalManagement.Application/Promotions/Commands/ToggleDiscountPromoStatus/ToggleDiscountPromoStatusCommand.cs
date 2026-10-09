using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Promotions.Commands.ToggleDiscountPromoStatus;

public sealed record ToggleDiscountPromoStatusCommand(
    Guid Id,
    bool? IsActive = null);

public sealed class ToggleDiscountPromoStatusCommandHandler : ICommandHandler<ToggleDiscountPromoStatusCommand, Result>
{
    private readonly IDiscountPromoRepository _promoRepository;

    public ToggleDiscountPromoStatusCommandHandler(IDiscountPromoRepository promoRepository)
    {
        _promoRepository = promoRepository;
    }

    public async Task<Result> Handle(ToggleDiscountPromoStatusCommand command, CancellationToken cancellationToken)
    {
        var promo = await _promoRepository.GetByIdAsync(command.Id, cancellationToken);
        if (promo == null)
        {
            return Result.Failure("promo.not_found", "Không tìm thấy chương trình khuyến mãi.");
        }

        var shouldBeActive = command.IsActive ?? !promo.IsActive;
        if (shouldBeActive == promo.IsActive)
        {
            return Result.Success();
        }

        var toggleResult = shouldBeActive ? promo.Activate() : promo.Deactivate();
        if (toggleResult.IsFailure)
        {
            return toggleResult;
        }

        await _promoRepository.ReplaceAsync(promo, cancellationToken);
        return Result.Success();
    }
}
