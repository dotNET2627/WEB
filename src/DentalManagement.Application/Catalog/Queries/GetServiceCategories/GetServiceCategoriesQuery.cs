using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Catalog.Common;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Queries.GetServiceCategories;

public sealed record GetServiceCategoriesQuery;

public sealed class GetServiceCategoriesQueryHandler
    : IQueryHandler<GetServiceCategoriesQuery, Result<IReadOnlyList<ServiceCategoryDto>>>
{
    private readonly IServiceCategoryRepository _categoryRepository;

    public GetServiceCategoriesQueryHandler(IServiceCategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Result<IReadOnlyList<ServiceCategoryDto>>> Handle(
        GetServiceCategoriesQuery query,
        CancellationToken cancellationToken)
    {
        var categories = await _categoryRepository.GetAllAsync(cancellationToken);
        var dtos = categories.Select(CatalogDtoMapper.ToDto).ToList();

        return Result<IReadOnlyList<ServiceCategoryDto>>.Success(dtos);
    }
}
