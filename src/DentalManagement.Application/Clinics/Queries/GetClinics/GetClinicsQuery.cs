using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Clinics.Dtos;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Clinics.Queries.GetClinics;

public sealed record GetClinicsQuery(
    int Page = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    bool? ActiveOnly = null) : IQuery;

public interface IQuery;

public sealed class GetClinicsQueryHandler : IQueryHandler<GetClinicsQuery, Result<PagedResult<ClinicDto>>>
{
    private readonly IClinicRepository _clinicRepository;

    public GetClinicsQueryHandler(IClinicRepository clinicRepository)
    {
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<PagedResult<ClinicDto>>> Handle(GetClinicsQuery query, CancellationToken cancellationToken)
    {
        var normalizedPage = Math.Max(1, query.Page);
        var normalizedPageSize = Math.Clamp(query.PageSize, 1, 100);

        var paged = await _clinicRepository.GetPagedAsync(
            normalizedPage,
            normalizedPageSize,
            query.SearchTerm,
            query.ActiveOnly,
            cancellationToken);

        var dtos = paged.Items.Select(c => new ClinicDto(
            c.Id,
            c.Name,
            c.Address,
            c.PhoneNumber,
            c.Email,
            c.Description,
            c.OpeningHours,
            c.Logo,
            c.IsActive,
            c.CreatedAt,
            c.UpdatedAt)).ToList();

        var result = new PagedResult<ClinicDto>(dtos, paged.Page, paged.PageSize, paged.TotalCount);
        return Result<PagedResult<ClinicDto>>.Success(result);
    }
}
