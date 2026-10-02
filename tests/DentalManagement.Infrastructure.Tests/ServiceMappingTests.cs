using DentalManagement.Domain.Catalog;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using Xunit;

namespace DentalManagement.Infrastructure.Tests;

public class ServiceMappingTests
{
    [Fact]
    public void ServiceDocumentMapper_ShouldMapToDocumentAndBackToDomain()
    {
        // Arrange
        var id = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var domain = new DentalService(
            id,
            "DV-TAYTRANG",
            "Tẩy trắng răng Laser",
            2500000m,
            categoryId,
            "Thẩm mỹ răng",
            "Liệu trình",
            60,
            "Tẩy trắng công nghệ cao",
            true);

        // Act - ToDocument
        var document = ServiceDocumentMapper.ToDocument(domain);

        // Assert Document
        Assert.Equal(domain.Id, document.Id);
        Assert.Equal("DV-TAYTRANG", document.Code);
        Assert.Equal("Tẩy trắng răng Laser", document.Name);
        Assert.Equal(2500000m, document.UnitPrice);
        Assert.Equal(categoryId, document.CategoryId);
        Assert.Equal("Thẩm mỹ răng", document.CategoryName);
        Assert.Equal("Liệu trình", document.Unit);
        Assert.Equal(60, document.EstimatedDurationMinutes);
        Assert.Equal("Tẩy trắng công nghệ cao", document.Description);
        Assert.True(document.IsActive);
        Assert.Equal(domain.CreatedAt, document.CreatedAt);
        Assert.Equal(domain.UpdatedAt, document.UpdatedAt);

        // Act - ToDomain
        var restoredDomain = ServiceDocumentMapper.ToDomain(document);

        // Assert Domain
        Assert.Equal(domain.Id, restoredDomain.Id);
        Assert.Equal(domain.Code, restoredDomain.Code);
        Assert.Equal(domain.Name, restoredDomain.Name);
        Assert.Equal(domain.UnitPrice, restoredDomain.UnitPrice);
        Assert.Equal(domain.CategoryId, restoredDomain.CategoryId);
        Assert.Equal(domain.CategoryName, restoredDomain.CategoryName);
        Assert.Equal(domain.Unit, restoredDomain.Unit);
        Assert.Equal(domain.EstimatedDurationMinutes, restoredDomain.EstimatedDurationMinutes);
        Assert.Equal(domain.Description, restoredDomain.Description);
        Assert.Equal(domain.IsActive, restoredDomain.IsActive);
        Assert.Equal(domain.CreatedAt, restoredDomain.CreatedAt);
        Assert.Equal(domain.UpdatedAt, restoredDomain.UpdatedAt);
    }

    [Fact]
    public void ServiceCategoryDocumentMapper_ShouldMapToDocumentAndBackToDomain()
    {
        // Arrange
        var id = Guid.NewGuid();
        var domain = new ServiceCategory(id, "Nha khoa trẻ em", "Các dịch vụ dành cho trẻ em");

        // Act - ToDocument
        var document = ServiceCategoryDocumentMapper.ToDocument(domain);

        // Assert Document
        Assert.Equal(domain.Id, document.Id);
        Assert.Equal("Nha khoa trẻ em", document.Name);
        Assert.Equal("Các dịch vụ dành cho trẻ em", document.Description);
        Assert.Equal(domain.CreatedAt, document.CreatedAt);
        Assert.Equal(domain.UpdatedAt, document.UpdatedAt);

        // Act - ToDomain
        var restoredDomain = ServiceCategoryDocumentMapper.ToDomain(document);

        // Assert Domain
        Assert.Equal(domain.Id, restoredDomain.Id);
        Assert.Equal(domain.Name, restoredDomain.Name);
        Assert.Equal(domain.Description, restoredDomain.Description);
        Assert.Equal(domain.CreatedAt, restoredDomain.CreatedAt);
        Assert.Equal(domain.UpdatedAt, restoredDomain.UpdatedAt);
    }
}
