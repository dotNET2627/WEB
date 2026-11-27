using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Catalog.Common;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Queries.GetDentalServiceById;

public sealed record GetDentalServiceByIdQuery(Guid Id);

public sealed class GetDentalServiceByIdQueryHandler
    : IQueryHandler<GetDentalServiceByIdQuery, Result<DentalServiceDto>>
{
    private readonly IServiceRepository _serviceRepository;

    public GetDentalServiceByIdQueryHandler(IServiceRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    public async Task<Result<DentalServiceDto>> Handle(
        GetDentalServiceByIdQuery query,
        CancellationToken cancellationToken)
    {
        var service = await _serviceRepository.GetByIdAsync(query.Id, cancellationToken);
        if (service is null)
        {
            return Result<DentalServiceDto>.Failure(
                "service.not_found",
                $"Không tìm thấy dịch vụ với id '{query.Id}'.");
        }

        return Result<DentalServiceDto>.Success(CatalogDtoMapper.ToDto(service));
    }
}
