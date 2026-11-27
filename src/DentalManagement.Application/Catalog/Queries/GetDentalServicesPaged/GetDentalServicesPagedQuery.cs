using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Catalog.Common;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Queries.GetDentalServicesPaged;

public sealed record GetDentalServicesPagedQuery(
    string? SearchTerm = null,
    Guid? CategoryId = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20)
{
    public PagedQuery ToPagedQuery() => new(Page, PageSize);
}

public sealed class GetDentalServicesPagedQueryHandler
    : IQueryHandler<GetDentalServicesPagedQuery, Result<PagedResult<DentalServiceDto>>>
{
    private readonly IServiceRepository _serviceRepository;

    public GetDentalServicesPagedQueryHandler(IServiceRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    public async Task<Result<PagedResult<DentalServiceDto>>> Handle(
        GetDentalServicesPagedQuery query,
        CancellationToken cancellationToken)
    {
        var pagedResult = await _serviceRepository.SearchAsync(
            query.SearchTerm,
            query.CategoryId,
            query.IsActive,
            query.ToPagedQuery(),
            cancellationToken);

        var dtos = pagedResult.Items.Select(CatalogDtoMapper.ToDto).ToList();
        var result = new PagedResult<DentalServiceDto>(
            dtos,
            pagedResult.Page,
            pagedResult.PageSize,
            pagedResult.TotalCount);

        return Result<PagedResult<DentalServiceDto>>.Success(result);
    }
}
