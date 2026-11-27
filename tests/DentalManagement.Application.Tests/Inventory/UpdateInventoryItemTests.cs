using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Inventory.Items.UpdateInventoryItem;
using DentalManagement.Domain.Inventory;
using Xunit;

namespace DentalManagement.Application.Tests.Inventory;

public sealed class UpdateInventoryItemTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Handle_OnlyUpdatesItemsInTheActiveClinic(bool useItemClinic)
    {
        var clock = new FixedClock();
        var item = InventoryItem.Create(
            Guid.NewGuid(), "VT01", "Original name", "Supplies", "Box", 5, null, clock.UtcNow).Value!;
        var repository = new TestInventoryItemRepository(item);
        var handler = new UpdateInventoryItemHandler(repository, clock);
        var clinicId = useItemClinic ? item.ClinicId : Guid.NewGuid();

        var result = await handler.Handle(
            new UpdateInventoryItemCommand(clinicId, item.Id, "Updated name", "Supplies", "Box", 5, null, true),
            CancellationToken.None);

        if (useItemClinic)
        {
            Assert.True(result.IsSuccess);
            Assert.Same(item, repository.ReplacedItem);
            Assert.Equal("Updated name", item.Name);
        }
        else
        {
            Assert.Equal("inventory.item_not_found", result.Error?.Code);
            Assert.Null(repository.ReplacedItem);
            Assert.Equal("Original name", item.Name);
        }
    }

    private sealed class FixedClock : IClock
    {
        public DateTimeOffset UtcNow => DateTimeOffset.UnixEpoch;
    }

    private sealed class TestInventoryItemRepository(InventoryItem item) : IInventoryItemRepository
    {
        public InventoryItem? ReplacedItem { get; private set; }

        public Task<InventoryItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(id == item.Id ? item : null);

        public Task ReplaceAsync(InventoryItem replacement, CancellationToken cancellationToken)
        {
            ReplacedItem = replacement;
            return Task.CompletedTask;
        }

        public Task<bool> ExistsByCodeAsync(Guid clinicId, string code, Guid? excludingId, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<InventoryItem>> ListByClinicAsync(Guid clinicId, string? search, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task AddAsync(InventoryItem newItem, CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }
}
