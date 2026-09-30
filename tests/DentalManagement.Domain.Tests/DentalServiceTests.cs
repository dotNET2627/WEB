using DentalManagement.Domain.Catalog;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class DentalServiceTests
{
    [Fact]
    public void Constructor_ShouldInitializeProperties_WhenValidArguments()
    {
        // Arrange
        var id = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        // Act
        var service = new DentalService(
            id,
            "DV-KHAM-01",
            "Khám tổng quát",
            150000m,
            categoryId,
            "Khám & Chẩn đoán",
            "Lần",
            30,
            "Khám và tư vấn tình trạng răng miệng",
            true);

        // Assert
        Assert.Equal(id, service.Id);
        Assert.Equal("DV-KHAM-01", service.Code);
        Assert.Equal("Khám tổng quát", service.Name);
        Assert.Equal(150000m, service.UnitPrice);
        Assert.Equal(categoryId, service.CategoryId);
        Assert.Equal("Khám & Chẩn đoán", service.CategoryName);
        Assert.Equal("Lần", service.Unit);
        Assert.Equal(30, service.EstimatedDurationMinutes);
        Assert.Equal("Khám và tư vấn tình trạng răng miệng", service.Description);
        Assert.True(service.IsActive);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_ShouldThrowArgumentException_WhenCodeIsInvalid(string invalidCode)
    {
        Assert.Throws<ArgumentException>(() => new DentalService(
            Guid.NewGuid(),
            invalidCode,
            "Dịch vụ",
            100000m));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_ShouldThrowArgumentException_WhenNameIsInvalid(string invalidName)
    {
        Assert.Throws<ArgumentException>(() => new DentalService(
            Guid.NewGuid(),
            "DV01",
            invalidName,
            100000m));
    }

    [Fact]
    public void Constructor_ShouldThrowArgumentException_WhenPriceIsNegative()
    {
        Assert.Throws<ArgumentException>(() => new DentalService(
            Guid.NewGuid(),
            "DV01",
            "Dịch vụ test",
            -1000m));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Constructor_ShouldThrowArgumentException_WhenDurationIsNotPositive(int invalidDuration)
    {
        Assert.Throws<ArgumentException>(() => new DentalService(
            Guid.NewGuid(),
            "DV01",
            "Dịch vụ test",
            100000m,
            estimatedDurationMinutes: invalidDuration));
    }

    [Fact]
    public void UpdateDetails_ShouldUpdateFieldsAndTouchTimestamp()
    {
        // Arrange
        var service = new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ cũ", 100000m);
        var oldUpdatedAt = service.UpdatedAt;
        var newCategoryId = Guid.NewGuid();

        // Act
        var result = service.UpdateDetails(
            "Dịch vụ mới",
            newCategoryId,
            "Nhóm mới",
            "Răng",
            45,
            "Mô tả cập nhật");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Dịch vụ mới", service.Name);
        Assert.Equal(newCategoryId, service.CategoryId);
        Assert.Equal("Nhóm mới", service.CategoryName);
        Assert.Equal("Răng", service.Unit);
        Assert.Equal(45, service.EstimatedDurationMinutes);
        Assert.Equal("Mô tả cập nhật", service.Description);
        Assert.True(service.UpdatedAt >= oldUpdatedAt);
    }

    [Fact]
    public void UpdateDetails_ShouldFail_WhenNameIsEmpty()
    {
        // Arrange
        var service = new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ", 100000m);

        // Act
        var result = service.UpdateDetails("", null, null, null, null, null);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("service.invalid_name", result.Error?.Code);
    }

    [Fact]
    public void UpdatePrice_ShouldUpdatePrice_WhenValid()
    {
        // Arrange
        var service = new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ", 100000m);

        // Act
        var result = service.UpdatePrice(200000m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(200000m, service.UnitPrice);
    }

    [Fact]
    public void UpdatePrice_ShouldFail_WhenNegative()
    {
        // Arrange
        var service = new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ", 100000m);

        // Act
        var result = service.UpdatePrice(-50000m);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("service.invalid_price", result.Error?.Code);
    }

    [Fact]
    public void ActivateAndDeactivate_ShouldChangeStatusProperly()
    {
        // Arrange
        var service = new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ", 100000m, isActive: true);

        // Act - Deactivate
        var deactivateResult = service.Deactivate();
        Assert.True(deactivateResult.IsSuccess);
        Assert.False(service.IsActive);

        // Act - Deactivate again should fail
        var secondDeactivate = service.Deactivate();
        Assert.False(secondDeactivate.IsSuccess);
        Assert.Equal("service.already_inactive", secondDeactivate.Error?.Code);

        // Act - Activate
        var activateResult = service.Activate();
        Assert.True(activateResult.IsSuccess);
        Assert.True(service.IsActive);

        // Act - Activate again should fail
        var secondActivate = service.Activate();
        Assert.False(secondActivate.IsSuccess);
        Assert.Equal("service.already_active", secondActivate.Error?.Code);
    }

    [Fact]
    public void ServiceCategory_ShouldInitializeAndUpdateCorrectly()
    {
        // Arrange & Act
        var categoryId = Guid.NewGuid();
        var category = new ServiceCategory(categoryId, "Tiểu phẫu", "Các thủ thuật tiểu phẫu nha khoa");

        // Assert
        Assert.Equal(categoryId, category.Id);
        Assert.Equal("Tiểu phẫu", category.Name);
        Assert.Equal("Các thủ thuật tiểu phẫu nha khoa", category.Description);

        // Update
        var updateResult = category.Update("Tiểu phẫu nâng cao", "Cập nhật mô tả");
        Assert.True(updateResult.IsSuccess);
        Assert.Equal("Tiểu phẫu nâng cao", category.Name);
        Assert.Equal("Cập nhật mô tả", category.Description);

        // Update with empty name
        var invalidUpdate = category.Update("  ", null);
        Assert.False(invalidUpdate.IsSuccess);
        Assert.Equal("category.invalid_name", invalidUpdate.Error?.Code);
    }

    [Fact]
    public void Rehydrate_ShouldRestoreAllFields()
    {
        // Arrange
        var id = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var createdAt = DateTimeOffset.UtcNow.AddDays(-10);
        var updatedAt = DateTimeOffset.UtcNow.AddDays(-1);

        // Act
        var service = DentalService.Rehydrate(
            id,
            "DV-TAYTRANG",
            "Tẩy trắng răng",
            2500000m,
            categoryId,
            "Thẩm mỹ",
            "Liệu trình",
            60,
            "Tẩy trắng bằng công nghệ Laser",
            true,
            createdAt,
            updatedAt);

        // Assert
        Assert.Equal(id, service.Id);
        Assert.Equal("DV-TAYTRANG", service.Code);
        Assert.Equal("Tẩy trắng răng", service.Name);
        Assert.Equal(2500000m, service.UnitPrice);
        Assert.Equal(categoryId, service.CategoryId);
        Assert.Equal("Thẩm mỹ", service.CategoryName);
        Assert.Equal("Liệu trình", service.Unit);
        Assert.Equal(60, service.EstimatedDurationMinutes);
        Assert.Equal("Tẩy trắng bằng công nghệ Laser", service.Description);
        Assert.True(service.IsActive);
        Assert.Equal(createdAt, service.CreatedAt);
        Assert.Equal(updatedAt, service.UpdatedAt);
    }
}
