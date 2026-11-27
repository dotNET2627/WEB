using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Inventory.Alerts.GetInventoryAlerts;

public sealed record GetInventoryAlertsQuery(Guid ClinicId, int Days = 30);

public sealed record LowStockItemAlertDto(
    Guid ItemId,
    string Code,
    string Name,
    string Unit,
    int TotalQuantityOnHand,
    int MinimumStock);

public sealed record ExpiringBatchAlertDto(
    Guid BatchId,
    Guid InventoryItemId,
    string ItemCode,
    string ItemName,
    string Unit,
    string BatchNumber,
    DateOnly ExpirationDate,
    int QuantityOnHand,
    decimal UnitCost,
    int DaysUntilExpiration,
    bool IsExpired);

public sealed record InventoryAlertsDto(
    decimal TotalInventoryValuation,
    int TotalActiveItems,
    int LowStockCount,
    int ExpiringSoonCount,
    int ExpiredCount,
    IReadOnlyList<LowStockItemAlertDto> LowStockItems,
    IReadOnlyList<ExpiringBatchAlertDto> ExpiringBatches);

public sealed class GetInventoryAlertsHandler
    : IQueryHandler<GetInventoryAlertsQuery, Result<InventoryAlertsDto>>
{
    private readonly IInventoryItemRepository _itemRepository;
    private readonly IInventoryBatchRepository _batchRepository;
    private readonly IClock _clock;

    public GetInventoryAlertsHandler(
        IInventoryItemRepository itemRepository,
        IInventoryBatchRepository batchRepository,
        IClock clock)
    {
        _itemRepository = itemRepository;
        _batchRepository = batchRepository;
        _clock = clock;
    }

    public async Task<Result<InventoryAlertsDto>> Handle(
        GetInventoryAlertsQuery query,
        CancellationToken cancellationToken)
    {
        var days = query.Days is 30 or 60 or 90 ? query.Days : Math.Clamp(query.Days, 1, 365);
        var today = DateOnly.FromDateTime(_clock.UtcNow.UtcDateTime);
        var thresholdDate = today.AddDays(days);

        var items = await _itemRepository.ListByClinicAsync(query.ClinicId, null, cancellationToken);
        var batches = await _batchRepository.ListByClinicAsync(query.ClinicId, cancellationToken);
        var itemLookup = items.ToDictionary(i => i.Id);

        var validBatches = batches.Where(b => b.QuantityOnHand > 0 && b.ExpirationDate >= today).ToList();
        var totalValuation = validBatches.Sum(b => b.QuantityOnHand * b.UnitCost);

        var stockByItem = validBatches
            .GroupBy(b => b.InventoryItemId)
            .ToDictionary(g => g.Key, g => g.Sum(b => b.QuantityOnHand));

        var lowStockItems = items
            .Where(i => i.IsActive)
            .Select(i => new
            {
                Item = i,
                Stock = stockByItem.GetValueOrDefault(i.Id, 0)
            })
            .Where(x => x.Stock <= x.Item.MinimumStock)
            .Select(x => new LowStockItemAlertDto(
                x.Item.Id,
                x.Item.Code,
                x.Item.Name,
                x.Item.Unit,
                x.Stock,
                x.Item.MinimumStock))
            .OrderBy(x => x.TotalQuantityOnHand)
            .ToList();

        var expiringBatches = batches
            .Where(b => b.QuantityOnHand > 0 && b.ExpirationDate <= thresholdDate)
            .Select(b =>
            {
                itemLookup.TryGetValue(b.InventoryItemId, out var item);
                var daysLeft = b.ExpirationDate.DayNumber - today.DayNumber;
                return new ExpiringBatchAlertDto(
                    b.Id,
                    b.InventoryItemId,
                    item?.Code ?? "—",
                    item?.Name ?? "Vật tư không xác định",
                    item?.Unit ?? "",
                    b.BatchNumber,
                    b.ExpirationDate,
                    b.QuantityOnHand,
                    b.UnitCost,
                    daysLeft,
                    daysLeft < 0);
            })
            .OrderBy(b => b.ExpirationDate)
            .ToList();

        return Result<InventoryAlertsDto>.Success(new InventoryAlertsDto(
            totalValuation,
            items.Count(i => i.IsActive),
            lowStockItems.Count,
            expiringBatches.Count(b => !b.IsExpired),
            expiringBatches.Count(b => b.IsExpired),
            lowStockItems,
            expiringBatches));
    }
}
