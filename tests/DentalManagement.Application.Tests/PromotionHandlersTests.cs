using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Promotions.Commands.CreateDiscountPromo;
using DentalManagement.Application.Promotions.Commands.DeleteDiscountPromo;
using DentalManagement.Application.Promotions.Commands.ToggleDiscountPromoStatus;
using DentalManagement.Application.Promotions.Commands.UpdateDiscountPromo;
using DentalManagement.Application.Promotions.Queries.GetDiscountPromoById;
using DentalManagement.Application.Promotions.Queries.GetDiscountPromosPaged;
using DentalManagement.Application.Promotions.Queries.ValidateDiscountPromo;
using DentalManagement.Domain.Promotions;
using Xunit;

namespace DentalManagement.Application.Tests;

public class PromotionHandlersTests
{
    private readonly FakeDiscountPromoRepository _repo = new();
    private readonly DateTimeOffset _baseDate = new(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task CreateDiscountPromo_ShouldSucceed_WhenCodeIsUnique()
    {
        var handler = new CreateDiscountPromoCommandHandler(_repo);
        var command = new CreateDiscountPromoCommand(
            "CHAOMUNG",
            "Chào mừng khách hàng mới",
            DiscountType.Percentage,
            15m,
            _baseDate,
            _baseDate.AddMonths(1),
            MaxDiscountAmount: 200000m,
            MinOrderAmount: 500000m);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var created = await _repo.GetByIdAsync(result.Value, CancellationToken.None);
        Assert.NotNull(created);
        Assert.Equal("CHAOMUNG", created.Code);
        Assert.Equal(15m, created.DiscountValue);
    }

    [Fact]
    public async Task CreateDiscountPromo_ShouldFail_WhenCodeAlreadyExists()
    {
        var existing = new DiscountPromo(
            Guid.NewGuid(),
            "EXISTING",
            "Mã cũ",
            DiscountType.FixedAmount,
            100000m,
            _baseDate);
        await _repo.AddAsync(existing, CancellationToken.None);

        var handler = new CreateDiscountPromoCommandHandler(_repo);
        var command = new CreateDiscountPromoCommand(
            "EXISTING",
            "Mã trùng",
            DiscountType.FixedAmount,
            200000m,
            _baseDate);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("promo.duplicate_code", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateDiscountPromo_ShouldSucceed_WhenPromoExists()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "UPDATE_ME",
            "Tiêu đề cũ",
            DiscountType.Percentage,
            10m,
            _baseDate);
        await _repo.AddAsync(promo, CancellationToken.None);

        var handler = new UpdateDiscountPromoCommandHandler(_repo);
        var command = new UpdateDiscountPromoCommand(
            promo.Id,
            "Tiêu đề đã cập nhật",
            "Mô tả mới",
            DiscountType.Percentage,
            25m,
            _baseDate,
            _baseDate.AddMonths(2),
            500000m,
            1000000m,
            200,
            DiscountScope.All,
            null,
            null);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var updated = await _repo.GetByIdAsync(promo.Id, CancellationToken.None);
        Assert.NotNull(updated);
        Assert.Equal("Tiêu đề đã cập nhật", updated.Title);
        Assert.Equal(25m, updated.DiscountValue);
    }

    [Fact]
    public async Task ToggleDiscountPromoStatus_ShouldDeactivateAndActivate()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "TOGGLE",
            "Chương trình toggle",
            DiscountType.FixedAmount,
            50000m,
            _baseDate,
            isActive: true);
        await _repo.AddAsync(promo, CancellationToken.None);

        var handler = new ToggleDiscountPromoStatusCommandHandler(_repo);

        // Deactivate
        var deactivateResult = await handler.Handle(new ToggleDiscountPromoStatusCommand(promo.Id, false), CancellationToken.None);
        Assert.True(deactivateResult.IsSuccess);
        var check1 = await _repo.GetByIdAsync(promo.Id, CancellationToken.None);
        Assert.False(check1!.IsActive);

        // Activate
        var activateResult = await handler.Handle(new ToggleDiscountPromoStatusCommand(promo.Id, true), CancellationToken.None);
        Assert.True(activateResult.IsSuccess);
        var check2 = await _repo.GetByIdAsync(promo.Id, CancellationToken.None);
        Assert.True(check2!.IsActive);
    }

    [Fact]
    public async Task DeleteDiscountPromo_ShouldRemoveFromRepository()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "DELETE_ME",
            "Sắp bị xóa",
            DiscountType.FixedAmount,
            100000m,
            _baseDate);
        await _repo.AddAsync(promo, CancellationToken.None);

        var handler = new DeleteDiscountPromoCommandHandler(_repo);
        var result = await handler.Handle(new DeleteDiscountPromoCommand(promo.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var deleted = await _repo.GetByIdAsync(promo.Id, CancellationToken.None);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task ValidateDiscountPromo_ShouldCalculateDiscount_WhenValid()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "VIP20",
            "Giảm 20% tối đa 400k",
            DiscountType.Percentage,
            20m,
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow.AddDays(10),
            maxDiscountAmount: 400000m,
            minOrderAmount: 1000000m);
        await _repo.AddAsync(promo, CancellationToken.None);

        var handler = new ValidateDiscountPromoQueryHandler(_repo);
        var query = new ValidateDiscountPromoQuery("VIP20", 2500000m);

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var val = result.Value!;
        Assert.True(val.IsValid);
        Assert.Equal(2500000m, val.OriginalAmount);
        Assert.Equal(400000m, val.DiscountAmount); // 20% của 2.500.000 là 500k, bị chặn ở 400k
        Assert.Equal(2100000m, val.FinalAmount);
    }

    [Fact]
    public async Task ValidateDiscountPromo_ShouldReturnInvalid_WhenMinOrderAmountNotReached()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "MIN2M",
            "Đơn tối thiểu 2 triệu",
            DiscountType.FixedAmount,
            200000m,
            DateTimeOffset.UtcNow.AddDays(-1),
            minOrderAmount: 2000000m);
        await _repo.AddAsync(promo, CancellationToken.None);

        var handler = new ValidateDiscountPromoQueryHandler(_repo);
        var query = new ValidateDiscountPromoQuery("MIN2M", 1500000m);

        var result = await handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var val = result.Value!;
        Assert.False(val.IsValid);
        Assert.Equal("promo.min_order_not_reached", val.ErrorCode);
        Assert.Equal(0m, val.DiscountAmount);
        Assert.Equal(1500000m, val.FinalAmount);
    }
}

// In-Memory Fake Repository for unit testing
internal sealed class FakeDiscountPromoRepository : IDiscountPromoRepository
{
    private readonly List<DiscountPromo> _promos = [];

    public Task<DiscountPromo?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(_promos.FirstOrDefault(p => p.Id == id));
    }

    public Task<DiscountPromo?> GetByCodeAsync(string code, CancellationToken cancellationToken)
    {
        return Task.FromResult(_promos.FirstOrDefault(p => p.Code.Equals(code.Trim(), StringComparison.OrdinalIgnoreCase)));
    }

    public Task<bool> PromoCodeExistsAsync(string code, Guid? excludingId, CancellationToken cancellationToken)
    {
        var exists = _promos.Any(p =>
            p.Code.Equals(code.Trim(), StringComparison.OrdinalIgnoreCase) &&
            (!excludingId.HasValue || p.Id != excludingId.Value));
        return Task.FromResult(exists);
    }

    public Task<PagedResult<DiscountPromo>> SearchAsync(
        string? searchTerm,
        DiscountType? discountType,
        bool? isActive,
        PagedQuery pagedQuery,
        CancellationToken cancellationToken)
    {
        var query = _promos.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim();
            query = query.Where(p =>
                p.Code.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                p.Title.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        if (discountType.HasValue)
        {
            query = query.Where(p => p.DiscountType == discountType.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        var list = query.ToList();
        var totalCount = list.Count;
        var pagedItems = list
            .Skip((pagedQuery.Page - 1) * pagedQuery.PageSize)
            .Take(pagedQuery.PageSize)
            .ToList();

        return Task.FromResult(new PagedResult<DiscountPromo>(pagedItems, pagedQuery.Page, pagedQuery.PageSize, totalCount));
    }

    public Task AddAsync(DiscountPromo promo, CancellationToken cancellationToken)
    {
        _promos.Add(promo);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(DiscountPromo promo, CancellationToken cancellationToken)
    {
        var idx = _promos.FindIndex(p => p.Id == promo.Id);
        if (idx >= 0)
        {
            _promos[idx] = promo;
        }
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        _promos.RemoveAll(p => p.Id == id);
        return Task.CompletedTask;
    }
}
