using DentalManagement.Domain.Promotions;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class DiscountPromoTests
{
    private readonly DateTimeOffset _baseDate = new(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Constructor_ShouldCreatePromo_WhenValidArguments()
    {
        var id = Guid.NewGuid();
        var promo = new DiscountPromo(
            id,
            "HE2026",
            "Khuyến mãi mùa hè",
            DiscountType.Percentage,
            20m,
            _baseDate,
            _baseDate.AddMonths(1),
            maxDiscountAmount: 500000m,
            minOrderAmount: 1000000m,
            usageLimit: 100,
            scope: DiscountScope.All,
            description: "Giảm 20% tối đa 500k cho đơn từ 1 triệu");

        Assert.Equal(id, promo.Id);
        Assert.Equal("HE2026", promo.Code);
        Assert.Equal("Khuyến mãi mùa hè", promo.Title);
        Assert.Equal(DiscountType.Percentage, promo.DiscountType);
        Assert.Equal(20m, promo.DiscountValue);
        Assert.Equal(500000m, promo.MaxDiscountAmount);
        Assert.Equal(1000000m, promo.MinOrderAmount);
        Assert.Equal(100, promo.UsageLimit);
        Assert.Equal(0, promo.UsedCount);
        Assert.True(promo.IsActive);
    }

    [Theory]
    [InlineData("", "Tiêu đề", 10)]
    [InlineData("CODE", "", 10)]
    [InlineData("CODE", "Tiêu đề", 0)]
    [InlineData("CODE", "Tiêu đề", -5)]
    public void Constructor_ShouldThrowArgumentException_WhenInvalidBasics(string code, string title, decimal value)
    {
        Assert.Throws<ArgumentException>(() => new DiscountPromo(
            Guid.NewGuid(),
            code,
            title,
            DiscountType.FixedAmount,
            value,
            _baseDate));
    }

    [Fact]
    public void Constructor_ShouldThrowArgumentException_WhenPercentageGreaterThan100()
    {
        Assert.Throws<ArgumentException>(() => new DiscountPromo(
            Guid.NewGuid(),
            "CODE",
            "Tiêu đề",
            DiscountType.Percentage,
            105m,
            _baseDate));
    }

    [Fact]
    public void Constructor_ShouldThrowArgumentException_WhenEndDateBeforeStartDate()
    {
        Assert.Throws<ArgumentException>(() => new DiscountPromo(
            Guid.NewGuid(),
            "CODE",
            "Tiêu đề",
            DiscountType.Percentage,
            10m,
            startDate: _baseDate,
            endDate: _baseDate.AddDays(-1)));
    }

    [Fact]
    public void CalculateDiscount_PercentageWithoutCap_ShouldCalculateCorrectly()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "DISC10",
            "Giảm 10%",
            DiscountType.Percentage,
            10m,
            _baseDate);

        var discount = promo.CalculateDiscount(2000000m);
        Assert.Equal(200000m, discount);
    }

    [Fact]
    public void CalculateDiscount_PercentageWithMaxCap_ShouldCapDiscount()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "DISC20",
            "Giảm 20% tối đa 300k",
            DiscountType.Percentage,
            20m,
            _baseDate,
            maxDiscountAmount: 300000m);

        // 20% của 3.000.000 = 600.000, nhưng bị chặn ở 300.000
        var discount = promo.CalculateDiscount(3000000m);
        Assert.Equal(300000m, discount);
    }

    [Fact]
    public void CalculateDiscount_FixedAmount_ShouldNotExceedEligibleAmount()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "GIAM500K",
            "Giảm 500k",
            DiscountType.FixedAmount,
            500000m,
            _baseDate);

        // Đơn 2 triệu -> giảm 500k
        Assert.Equal(500000m, promo.CalculateDiscount(2000000m));

        // Đơn chỉ có 300k -> chỉ giảm tối đa 300k (không âm tiền)
        Assert.Equal(300000m, promo.CalculateDiscount(300000m));
    }

    [Fact]
    public void CanApply_ShouldReturnFailure_WhenExpired()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "EXPIRED",
            "Hết hạn",
            DiscountType.Percentage,
            10m,
            startDate: _baseDate,
            endDate: _baseDate.AddDays(5));

        var checkDate = _baseDate.AddDays(6);
        var result = promo.CanApply(500000m, null, null, checkDate);

        Assert.True(result.IsFailure);
        Assert.Equal("promo.expired", result.Error!.Code);
    }

    [Fact]
    public void CanApply_ShouldReturnFailure_WhenNotStarted()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "FUTURE",
            "Tương lai",
            DiscountType.Percentage,
            10m,
            startDate: _baseDate.AddDays(10));

        var checkDate = _baseDate.AddDays(5);
        var result = promo.CanApply(500000m, null, null, checkDate);

        Assert.True(result.IsFailure);
        Assert.Equal("promo.not_started", result.Error!.Code);
    }

    [Fact]
    public void CanApply_ShouldReturnFailure_WhenMinOrderAmountNotReached()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "MINORDER",
            "Đơn tối thiểu 1 triệu",
            DiscountType.Percentage,
            10m,
            startDate: _baseDate,
            minOrderAmount: 1000000m);

        var result = promo.CanApply(800000m, null, null, _baseDate.AddDays(1));

        Assert.True(result.IsFailure);
        Assert.Equal("promo.min_order_not_reached", result.Error!.Code);
    }

    [Fact]
    public void CanApply_ShouldReturnFailure_WhenScopeIsSpecificServices_AndNoMatchingService()
    {
        var service1 = Guid.NewGuid();
        var service2 = Guid.NewGuid();
        var service3 = Guid.NewGuid();

        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "SERVICE_ONLY",
            "Chỉ áp dụng dịch vụ 1 và 2",
            DiscountType.Percentage,
            10m,
            startDate: _baseDate,
            scope: DiscountScope.SpecificServices,
            applicableServiceIds: [service1, service2]);

        // Đơn hàng chỉ có service3
        var result = promo.CanApply(500000m, [service3], null, _baseDate.AddDays(1));

        Assert.True(result.IsFailure);
        Assert.Equal("promo.services_not_applicable", result.Error!.Code);

        // Đơn hàng có service1 -> Hợp lệ
        var validResult = promo.CanApply(500000m, [service1, service3], null, _baseDate.AddDays(1));
        Assert.True(validResult.IsSuccess);
    }

    [Fact]
    public void RecordUsage_ShouldIncrementUsedCount_AndFailWhenExceedLimit()
    {
        var promo = new DiscountPromo(
            Guid.NewGuid(),
            "LIMITED",
            "Chỉ 2 lượt dùng",
            DiscountType.FixedAmount,
            100000m,
            startDate: _baseDate,
            usageLimit: 2);

        Assert.True(promo.RecordUsage().IsSuccess);
        Assert.Equal(1, promo.UsedCount);

        Assert.True(promo.RecordUsage().IsSuccess);
        Assert.Equal(2, promo.UsedCount);

        // Lượt thứ 3 -> Thất bại
        var failed = promo.RecordUsage();
        Assert.True(failed.IsFailure);
        Assert.Equal("promo.usage_exceeded", failed.Error!.Code);
    }

    [Fact]
    public void Rehydrate_ShouldRestoreAllFieldsAndAuditDates()
    {
        var id = Guid.NewGuid();
        var createdAt = DateTimeOffset.UtcNow.AddDays(-10);
        var updatedAt = DateTimeOffset.UtcNow.AddDays(-2);

        var promo = DiscountPromo.Rehydrate(
            id,
            "REHYDRATE",
            "Khôi phục",
            "Mô tả khôi phục",
            DiscountType.FixedAmount,
            200000m,
            null,
            500000m,
            _baseDate,
            _baseDate.AddMonths(2),
            50,
            usedCount: 15,
            DiscountScope.All,
            null,
            null,
            isActive: true,
            createdAt,
            updatedAt);

        Assert.Equal(id, promo.Id);
        Assert.Equal("REHYDRATE", promo.Code);
        Assert.Equal(15, promo.UsedCount);
        Assert.Equal(createdAt, promo.CreatedAt);
        Assert.Equal(updatedAt, promo.UpdatedAt);
    }
}
