using DentalManagement.Api.Contracts;
using DentalManagement.Api.Validators;
using Xunit;

namespace DentalManagement.Api.Tests;

public class CatalogValidatorsTests
{
    private readonly CreateDentalServiceRequestValidator _createValidator = new();
    private readonly UpdateDentalServiceRequestValidator _updateValidator = new();
    private readonly CreateServiceCategoryRequestValidator _categoryValidator = new();

    [Fact]
    public void CreateDentalServiceRequestValidator_ShouldPass_WhenValid()
    {
        var request = new CreateDentalServiceRequest(
            "DV-NIENG",
            "Niềng răng mắc cài kim loại",
            25000000m,
            Guid.NewGuid(),
            "Hàm",
            60,
            "Chỉnh nha thẩm mỹ",
            true);

        var result = _createValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", "Tên dịch vụ", 100000)]
    [InlineData("DV01", "", 100000)]
    [InlineData("DV01", "Tên dịch vụ", -100)]
    public void CreateDentalServiceRequestValidator_ShouldFail_WhenInvalid(string code, string name, decimal price)
    {
        var request = new CreateDentalServiceRequest(code, name, price);
        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateDentalServiceRequestValidator_ShouldFail_WhenDurationIsZeroOrNegative()
    {
        var request = new CreateDentalServiceRequest("DV01", "Dịch vụ", 100000m, EstimatedDurationMinutes: 0);
        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void UpdateDentalServiceRequestValidator_ShouldPass_WhenValid()
    {
        var request = new UpdateDentalServiceRequest(
            "Tẩy trắng răng tại phòng khám",
            1800000m,
            null,
            "Liệu trình",
            45,
            "Mô tả");

        var result = _updateValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateDentalServiceRequestValidator_ShouldFail_WhenNameEmptyOrPriceNegative()
    {
        var request = new UpdateDentalServiceRequest("", -500m);
        var result = _updateValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Equal(2, result.Errors.Count);
    }

    [Fact]
    public void CreateServiceCategoryRequestValidator_ShouldPass_WhenValid()
    {
        var request = new CreateServiceCategoryRequest("Chỉnh nha - Niềng răng", "Các kỹ thuật chỉnh hình răng mặt");
        var result = _categoryValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateServiceCategoryRequestValidator_ShouldFail_WhenNameIsEmpty()
    {
        var request = new CreateServiceCategoryRequest("");
        var result = _categoryValidator.Validate(request);
        Assert.False(result.IsValid);
    }
}
