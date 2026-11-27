using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;
using FluentValidation;

namespace DentalManagement.Application.Inventory.Items.CreateInventoryItem;

public sealed record CreateInventoryItemCommand(
    Guid ClinicId,
    string Code,
    string Name,
    string Category,
    string Unit,
    int MinimumStock,
    string? Description);

public sealed class CreateInventoryItemValidator : AbstractValidator<CreateInventoryItemCommand>
{
    public CreateInventoryItemValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Unit).NotEmpty().MaximumLength(50);
        RuleFor(x => x.MinimumStock).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateInventoryItemHandler : ICommandHandler<CreateInventoryItemCommand, Result<Guid>>
{
    private readonly IInventoryItemRepository _itemRepository;
    private readonly IClock _clock;

    public CreateInventoryItemHandler(IInventoryItemRepository itemRepository, IClock clock)
    {
        _itemRepository = itemRepository;
        _clock = clock;
    }

    public async Task<Result<Guid>> Handle(CreateInventoryItemCommand command, CancellationToken cancellationToken)
    {
        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        var exists = await _itemRepository.ExistsByCodeAsync(command.ClinicId, normalizedCode, null, cancellationToken);
        if (exists)
        {
            return Result<Guid>.Failure("inventory.duplicate_code", $"Mã vật tư '{normalizedCode}' đã tồn tại trong phòng khám.");
        }

        var itemResult = InventoryItem.Create(
            command.ClinicId,
            command.Code,
            command.Name,
            command.Category,
            command.Unit,
            command.MinimumStock,
            command.Description,
            _clock.UtcNow);

        if (itemResult.IsFailure)
        {
            return Result<Guid>.Failure(itemResult.Error!.Code, itemResult.Error.Message);
        }

        await _itemRepository.AddAsync(itemResult.Value!, cancellationToken);
        return Result<Guid>.Success(itemResult.Value!.Id);
    }
}
