using DentalManagement.Domain.Promotions;
using DentalManagement.Infrastructure.Persistence.Mappings;
using Xunit;

namespace DentalManagement.Infrastructure.Tests;

public class PromotionMappingTests
{
    [Fact]
    public void DiscountPromoDocumentMapper_ShouldMapToDocumentAndBackToDomain()
    {
        // Arrange
        var id = Guid.NewGuid();
        var serviceId1 = Guid.NewGuid();
        var serviceId2 = Guid.NewGuid();
        var categoryId1 = Guid.NewGuid();
        var startDate = new DateTimeOffset(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);
        var endDate = new DateTimeOffset(2026, 12, 31, 23, 59, 59, TimeSpan.Zero);

        var domain = new DiscountPromo(
            id,
            "TET2027",
            "Ưu đãi đón Tết",
            DiscountType.Percentage,
            15m,
            startDate,
            endDate,
            maxDiscountAmount: 500000m,
            minOrderAmount: 2000000m,
            usageLimit: 500,
            scope: DiscountScope.SpecificServices,
            applicableServiceIds: [serviceId1, serviceId2],
            applicableCategoryIds: [categoryId1],
            description: "Chương trình ưu đãi Tết đặc biệt",
            isActive: true);

        domain.RecordUsage(); // UsedCount = 1

        // Act - ToDocument
        var document = DiscountPromoDocumentMapper.ToDocument(domain);

        // Assert Document
        Assert.Equal(domain.Id, document.Id);
        Assert.Equal("TET2027", document.Code);
        Assert.Equal("Ưu đãi đón Tết", document.Title);
        Assert.Equal((int)DiscountType.Percentage, document.DiscountType);
        Assert.Equal(15m, document.DiscountValue);
        Assert.Equal(500000m, document.MaxDiscountAmount);
        Assert.Equal(2000000m, document.MinOrderAmount);
        Assert.Equal(startDate, document.StartDate);
        Assert.Equal(endDate, document.EndDate);
        Assert.Equal(500, document.UsageLimit);
        Assert.Equal(1, document.UsedCount);
        Assert.Equal((int)DiscountScope.SpecificServices, document.Scope);
        Assert.Contains(serviceId1, document.ApplicableServiceIds);
        Assert.Contains(serviceId2, document.ApplicableServiceIds);
        Assert.Contains(categoryId1, document.ApplicableCategoryIds);
        Assert.Equal("Chương trình ưu đãi Tết đặc biệt", document.Description);
        Assert.True(document.IsActive);
        Assert.Equal(domain.CreatedAt, document.CreatedAt);
        Assert.Equal(domain.UpdatedAt, document.UpdatedAt);

        // Act - ToDomain
        var restored = DiscountPromoDocumentMapper.ToDomain(document);

        // Assert Domain
        Assert.Equal(domain.Id, restored.Id);
        Assert.Equal(domain.Code, restored.Code);
        Assert.Equal(domain.Title, restored.Title);
        Assert.Equal(domain.DiscountType, restored.DiscountType);
        Assert.Equal(domain.DiscountValue, restored.DiscountValue);
        Assert.Equal(domain.MaxDiscountAmount, restored.MaxDiscountAmount);
        Assert.Equal(domain.MinOrderAmount, restored.MinOrderAmount);
        Assert.Equal(domain.StartDate, restored.StartDate);
        Assert.Equal(domain.EndDate, restored.EndDate);
        Assert.Equal(domain.UsageLimit, restored.UsageLimit);
        Assert.Equal(domain.UsedCount, restored.UsedCount);
        Assert.Equal(domain.Scope, restored.Scope);
        Assert.Equal(domain.ApplicableServiceIds.Count, restored.ApplicableServiceIds.Count);
        Assert.Contains(serviceId1, restored.ApplicableServiceIds);
        Assert.Contains(serviceId2, restored.ApplicableServiceIds);
        Assert.Contains(categoryId1, restored.ApplicableCategoryIds);
        Assert.Equal(domain.Description, restored.Description);
        Assert.Equal(domain.IsActive, restored.IsActive);
        Assert.Equal(domain.CreatedAt, restored.CreatedAt);
        Assert.Equal(domain.UpdatedAt, restored.UpdatedAt);
    }
}
