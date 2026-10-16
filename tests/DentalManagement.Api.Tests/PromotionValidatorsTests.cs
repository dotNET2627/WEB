using DentalManagement.Api.Contracts;
using DentalManagement.Api.Validators;
using DentalManagement.Domain.Promotions;
using Xunit;

namespace DentalManagement.Api.Tests;

public class PromotionValidatorsTests
{
    private readonly CreateDiscountPromoRequestValidator _createValidator = new();
    private readonly UpdateDiscountPromoRequestValidator _updateValidator = new();
    private readonly ValidateDiscountPromoRequestValidator _validateValidator = new();
    private readonly DateTimeOffset _baseDate = new(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CreateDiscountPromoRequestValidator_ShouldPass_WhenValid()
    {
        var request = new CreateDiscountPromoRequest(
            "CHAOMUNG",
            "Ưu đãi khách hàng mới",
            DiscountType.Percentage,
            20m,
            _baseDate,
            _baseDate.AddMonths(1),
            MaxDiscountAmount: 300000m,
            MinOrderAmount: 1000000m,
            UsageLimit: 100,
            Scope: DiscountScope.All,
            Description: "Giảm 20% tối đa 300k cho đơn từ 1 triệu",
            IsActive: true);

        var result = _createValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", "Tiêu đề", 10)]
    [InlineData("CODE", "", 10)]
    [InlineData("CODE", "Tiêu đề", 0)]
    [InlineData("CODE", "Tiêu đề", -5)]
    public void CreateDiscountPromoRequestValidator_ShouldFail_WhenBasicsInvalid(string code, string title, decimal value)
    {
        var request = new CreateDiscountPromoRequest(code, title, DiscountType.FixedAmount, value, _baseDate);
        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateDiscountPromoRequestValidator_ShouldFail_WhenPercentageGreaterThan100()
    {
        var request = new CreateDiscountPromoRequest("CODE", "Tiêu đề", DiscountType.Percentage, 105m, _baseDate);
        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateDiscountPromoRequestValidator_ShouldFail_WhenEndDateBeforeStartDate()
    {
        var request = new CreateDiscountPromoRequest(
            "CODE",
            "Tiêu đề",
            DiscountType.Percentage,
            10m,
            StartDate: _baseDate,
            EndDate: _baseDate.AddDays(-2));

        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void UpdateDiscountPromoRequestValidator_ShouldPass_WhenValid()
    {
        var request = new UpdateDiscountPromoRequest(
            "Tiêu đề đã cập nhật",
            DiscountType.FixedAmount,
            150000m,
            _baseDate,
            _baseDate.AddMonths(2),
            MaxDiscountAmount: null,
            MinOrderAmount: 500000m,
            UsageLimit: 200,
            Scope: DiscountScope.All,
            ApplicableServiceIds: null,
            ApplicableCategoryIds: null,
            Description: "Mô tả mới");

        var result = _updateValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateDiscountPromoRequestValidator_ShouldFail_WhenTitleEmptyOrValueZero()
    {
        var request = new UpdateDiscountPromoRequest(
            "",
            DiscountType.Percentage,
            0m,
            _baseDate);

        var result = _updateValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Equal(2, result.Errors.Count);
    }

    [Fact]
    public void ValidateDiscountPromoRequestValidator_ShouldPass_WhenValid()
    {
        var request = new ValidateDiscountPromoRequest("KM2026", 1500000m, [Guid.NewGuid()]);
        var result = _validateValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", 100000)]
    [InlineData("CODE", -50000)]
    public void ValidateDiscountPromoRequestValidator_ShouldFail_WhenCodeEmptyOrAmountNegative(string code, decimal amount)
    {
        var request = new ValidateDiscountPromoRequest(code, amount);
        var result = _validateValidator.Validate(request);
        Assert.False(result.IsValid);
    }
}
