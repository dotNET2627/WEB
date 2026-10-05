using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Clinics.Dtos;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Clinics.Queries.GetClinicById;

public sealed record GetClinicByIdQuery(Guid Id);

public sealed class GetClinicByIdQueryHandler : IQueryHandler<GetClinicByIdQuery, Result<ClinicDto>>
{
    private readonly IClinicRepository _clinicRepository;

    public GetClinicByIdQueryHandler(IClinicRepository clinicRepository)
    {
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<ClinicDto>> Handle(GetClinicByIdQuery query, CancellationToken cancellationToken)
    {
        var clinic = await _clinicRepository.GetByIdAsync(query.Id, cancellationToken);
        if (clinic is null)
        {
            return Result<ClinicDto>.Failure("clinic.not_found", "Không tìm thấy thông tin phòng khám.");
        }

        var dto = new ClinicDto(
            clinic.Id,
            clinic.Name,
            clinic.Address,
            clinic.PhoneNumber,
            clinic.Email,
            clinic.Description,
            clinic.OpeningHours,
            clinic.Logo,
            clinic.IsActive,
            clinic.CreatedAt,
            clinic.UpdatedAt);

        return Result<ClinicDto>.Success(dto);
    }
}
