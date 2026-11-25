using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using FluentValidation;

namespace DentalManagement.Application.Inventory.Items.UpdateInventoryItem;

public sealed record UpdateInventoryItemCommand(
    Guid Id,
    string Name,
    string Category,
    string Unit,
    int MinimumStock,
    string? Description,
    bool IsActive);

public sealed class UpdateInventoryItemValidator : AbstractValidator<UpdateInventoryItemCommand>
{
    public UpdateInventoryItemValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Unit).NotEmpty().MaximumLength(50);
        RuleFor(x => x.MinimumStock).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateInventoryItemHandler : ICommandHandler<UpdateInventoryItemCommand, Result>
{
    private readonly IInventoryItemRepository _itemRepository;
    private readonly IClock _clock;

    public UpdateInventoryItemHandler(IInventoryItemRepository itemRepository, IClock clock)
    {
        _itemRepository = itemRepository;
        _clock = clock;
    }

    public async Task<Result> Handle(UpdateInventoryItemCommand command, CancellationToken cancellationToken)
    {
        var item = await _itemRepository.GetByIdAsync(command.Id, cancellationToken);
        if (item is null)
        {
            return Result.Failure("inventory.item_not_found", "Không tìm thấy vật tư.");
        }

        var updateResult = item.Update(
            command.Name,
            command.Category,
            command.Unit,
            command.MinimumStock,
            command.Description,
            command.IsActive,
            _clock.UtcNow);

        if (updateResult.IsFailure)
        {
            return updateResult;
        }

        await _itemRepository.ReplaceAsync(item, cancellationToken);
        return Result.Success();
    }
}
