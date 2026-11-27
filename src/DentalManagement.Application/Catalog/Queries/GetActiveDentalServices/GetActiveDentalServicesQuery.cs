using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Catalog.Common;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Queries.GetActiveDentalServices;

public sealed record GetActiveDentalServicesQuery;

public sealed class GetActiveDentalServicesQueryHandler
    : IQueryHandler<GetActiveDentalServicesQuery, Result<IReadOnlyList<DentalServiceDto>>>
{
    private readonly IServiceRepository _serviceRepository;

    public GetActiveDentalServicesQueryHandler(IServiceRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    public async Task<Result<IReadOnlyList<DentalServiceDto>>> Handle(
        GetActiveDentalServicesQuery query,
        CancellationToken cancellationToken)
    {
        var services = await _serviceRepository.GetAllActiveAsync(cancellationToken);
        var dtos = services.Select(CatalogDtoMapper.ToDto).ToList();

        return Result<IReadOnlyList<DentalServiceDto>>.Success(dtos);
    }
}
