using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Catalog.Commands.CreateDentalService;
using DentalManagement.Application.Catalog.Commands.CreateServiceCategory;
using DentalManagement.Application.Catalog.Commands.ToggleDentalServiceStatus;
using DentalManagement.Application.Catalog.Commands.UpdateDentalService;
using DentalManagement.Application.Catalog.Queries.GetActiveDentalServices;
using DentalManagement.Application.Catalog.Queries.GetDentalServiceById;
using DentalManagement.Application.Catalog.Queries.GetDentalServicesPaged;
using DentalManagement.Application.Catalog.Queries.GetServiceCategories;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Catalog;
using Xunit;

namespace DentalManagement.Application.Tests;

public class CatalogHandlersTests
{
    private readonly FakeServiceRepository _serviceRepo = new();
    private readonly FakeServiceCategoryRepository _categoryRepo = new();

    [Fact]
    public async Task CreateDentalService_ShouldSucceed_WhenCodeIsUnique()
    {
        // Arrange
        var category = new ServiceCategory(Guid.NewGuid(), "Khám & Tư vấn");
        await _categoryRepo.AddAsync(category, CancellationToken.None);

        var handler = new CreateDentalServiceCommandHandler(_serviceRepo, _categoryRepo);
        var command = new CreateDentalServiceCommand(
            "DV-KHAM",
            "Khám tổng quát",
            100000m,
            category.Id,
            "Lần",
            30,
            "Mô tả dịch vụ",
            true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var created = await _serviceRepo.GetByIdAsync(result.Value, CancellationToken.None);
        Assert.NotNull(created);
        Assert.Equal("DV-KHAM", created.Code);
        Assert.Equal("Khám tổng quát", created.Name);
        Assert.Equal("Khám & Tư vấn", created.CategoryName);
    }

    [Fact]
    public async Task CreateDentalService_ShouldFail_WhenCodeAlreadyExists()
    {
        // Arrange
        var existing = new DentalService(Guid.NewGuid(), "DV-TRARANG", "Trám răng", 200000m);
        await _serviceRepo.AddAsync(existing, CancellationToken.None);

        var handler = new CreateDentalServiceCommandHandler(_serviceRepo, _categoryRepo);
        var command = new CreateDentalServiceCommand("DV-TRARANG", "Trám răng mới", 250000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("service.duplicate_code", result.Error?.Code);
    }

    [Fact]
    public async Task CreateDentalService_ShouldFail_WhenCategoryDoesNotExist()
    {
        // Arrange
        var handler = new CreateDentalServiceCommandHandler(_serviceRepo, _categoryRepo);
        var command = new CreateDentalServiceCommand(
            "DV01",
            "Dịch vụ",
            100000m,
            CategoryId: Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("category.not_found", result.Error?.Code);
    }

    [Fact]
    public async Task UpdateDentalService_ShouldSucceed_WhenValid()
    {
        // Arrange
        var service = new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ cũ", 100000m);
        await _serviceRepo.AddAsync(service, CancellationToken.None);

        var category = new ServiceCategory(Guid.NewGuid(), "Nha khoa tổng quát");
        await _categoryRepo.AddAsync(category, CancellationToken.None);

        var handler = new UpdateDentalServiceCommandHandler(_serviceRepo, _categoryRepo);
        var command = new UpdateDentalServiceCommand(
            service.Id,
            "Dịch vụ mới",
            150000m,
            category.Id,
            "Răng",
            40,
            "Mô tả mới");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var updated = await _serviceRepo.GetByIdAsync(service.Id, CancellationToken.None);
        Assert.NotNull(updated);
        Assert.Equal("Dịch vụ mới", updated.Name);
        Assert.Equal(150000m, updated.UnitPrice);
        Assert.Equal("Nha khoa tổng quát", updated.CategoryName);
    }

    [Fact]
    public async Task ToggleDentalServiceStatus_ShouldToggleStatus()
    {
        // Arrange
        var service = new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ", 100000m, isActive: true);
        await _serviceRepo.AddAsync(service, CancellationToken.None);

        var handler = new ToggleDentalServiceStatusCommandHandler(_serviceRepo);

        // Act - Deactivate
        var deactivateResult = await handler.Handle(new ToggleDentalServiceStatusCommand(service.Id, false), CancellationToken.None);
        Assert.True(deactivateResult.IsSuccess);
        Assert.False(service.IsActive);

        // Act - Activate
        var activateResult = await handler.Handle(new ToggleDentalServiceStatusCommand(service.Id, true), CancellationToken.None);
        Assert.True(activateResult.IsSuccess);
        Assert.True(service.IsActive);
    }

    [Fact]
    public async Task GetDentalServicesPaged_ShouldReturnPagedDtos()
    {
        // Arrange
        await _serviceRepo.AddAsync(new DentalService(Guid.NewGuid(), "DV01", "Cạo vôi răng", 150000m), CancellationToken.None);
        await _serviceRepo.AddAsync(new DentalService(Guid.NewGuid(), "DV02", "Nhổ răng", 300000m), CancellationToken.None);

        var handler = new GetDentalServicesPagedQueryHandler(_serviceRepo);
        var query = new GetDentalServicesPagedQuery(Page: 1, PageSize: 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value?.Items.Count);
        Assert.Equal(2, result.Value?.TotalCount);
    }

    [Fact]
    public async Task GetActiveDentalServices_ShouldOnlyReturnActiveServices()
    {
        // Arrange
        await _serviceRepo.AddAsync(new DentalService(Guid.NewGuid(), "DV01", "Dịch vụ đang mở", 100000m, isActive: true), CancellationToken.None);
        await _serviceRepo.AddAsync(new DentalService(Guid.NewGuid(), "DV02", "Dịch vụ tạm dừng", 100000m, isActive: false), CancellationToken.None);

        var handler = new GetActiveDentalServicesQueryHandler(_serviceRepo);

        // Act
        var result = await handler.Handle(new GetActiveDentalServicesQuery(), CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("DV01", result.Value![0].Code);
    }
}

internal sealed class FakeServiceRepository : IServiceRepository
{
    private readonly List<DentalService> _items = [];

    public Task<DentalService?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(_items.FirstOrDefault(x => x.Id == id));

    public Task<DentalService?> GetByCodeAsync(string code, CancellationToken cancellationToken) =>
        Task.FromResult(_items.FirstOrDefault(x => x.Code.Equals(code.Trim(), StringComparison.OrdinalIgnoreCase)));

    public Task<bool> ServiceCodeExistsAsync(string code, Guid? excludingId, CancellationToken cancellationToken) =>
        Task.FromResult(_items.Any(x => x.Code.Equals(code.Trim(), StringComparison.OrdinalIgnoreCase) && x.Id != excludingId));

    public Task<PagedResult<DentalService>> SearchAsync(
        string? searchTerm,
        Guid? categoryId,
        bool? isActive,
        PagedQuery pagedQuery,
        CancellationToken cancellationToken)
    {
        var query = _items.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)
                                  || x.Code.Contains(searchTerm, StringComparison.OrdinalIgnoreCase));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == categoryId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        var list = query.ToList();
        var paged = list
            .Skip((pagedQuery.NormalizedPage - 1) * pagedQuery.NormalizedPageSize)
            .Take(pagedQuery.NormalizedPageSize)
            .ToList();

        return Task.FromResult(new PagedResult<DentalService>(paged, pagedQuery.NormalizedPage, pagedQuery.NormalizedPageSize, list.Count));
    }

    public Task<IReadOnlyList<DentalService>> GetAllActiveAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<DentalService>>(_items.Where(x => x.IsActive).ToList());

    public Task AddAsync(DentalService service, CancellationToken cancellationToken)
    {
        _items.Add(service);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(DentalService service, CancellationToken cancellationToken)
    {
        var index = _items.FindIndex(x => x.Id == service.Id);
        if (index >= 0)
        {
            _items[index] = service;
        }
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        _items.RemoveAll(x => x.Id == id);
        return Task.CompletedTask;
    }
}

internal sealed class FakeServiceCategoryRepository : IServiceCategoryRepository
{
    private readonly List<ServiceCategory> _categories = [];

    public Task<ServiceCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(_categories.FirstOrDefault(x => x.Id == id));

    public Task<IReadOnlyList<ServiceCategory>> GetAllAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<ServiceCategory>>(_categories.ToList());

    public Task<bool> CategoryNameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken) =>
        Task.FromResult(_categories.Any(x => x.Name.Equals(name.Trim(), StringComparison.OrdinalIgnoreCase) && x.Id != excludingId));

    public Task AddAsync(ServiceCategory category, CancellationToken cancellationToken)
    {
        _categories.Add(category);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(ServiceCategory category, CancellationToken cancellationToken)
    {
        var index = _categories.FindIndex(x => x.Id == category.Id);
        if (index >= 0)
        {
            _categories[index] = category;
        }
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        _categories.RemoveAll(x => x.Id == id);
        return Task.CompletedTask;
    }
}
