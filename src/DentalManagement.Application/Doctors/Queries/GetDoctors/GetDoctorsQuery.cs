using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Doctors.Queries.GetDoctors;

public sealed record GetDoctorsQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? ClinicId = null,
    string? Specialty = null,
    string? SearchTerm = null);

public sealed class GetDoctorsQueryHandler : IQueryHandler<GetDoctorsQuery, Result<PagedResult<DoctorDto>>>
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClinicRepository _clinicRepository;

    public GetDoctorsQueryHandler(
        IDoctorRepository doctorRepository,
        IUserRepository userRepository,
        IClinicRepository clinicRepository)
    {
        _doctorRepository = doctorRepository;
        _userRepository = userRepository;
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<PagedResult<DoctorDto>>> Handle(GetDoctorsQuery query, CancellationToken cancellationToken)
    {
        var normalizedPage = Math.Max(1, query.Page);
        var normalizedPageSize = Math.Clamp(query.PageSize, 1, 100);

        var paged = await _doctorRepository.GetPagedAsync(
            normalizedPage,
            normalizedPageSize,
            query.ClinicId == Guid.Empty ? null : query.ClinicId,
            query.Specialty,
            query.SearchTerm,
            cancellationToken);

        var dtos = new List<DoctorDto>();

        foreach (var doctor in paged.Items)
        {
            var user = await _userRepository.GetByIdAsync(doctor.UserId, cancellationToken);
            string? clinicName = null;
            if (doctor.ClinicId.HasValue)
            {
                var clinic = await _clinicRepository.GetByIdAsync(doctor.ClinicId.Value, cancellationToken);
                clinicName = clinic?.Name;
            }

            dtos.Add(new DoctorDto(
                doctor.Id,
                doctor.UserId,
                doctor.ClinicId,
                clinicName,
                doctor.MedicalLicenseNumber,
                doctor.YearsOfExperience,
                doctor.Specialty,
                doctor.Biography,
                user?.FullName,
                user?.Email,
                null,
                null,
                doctor.WorkSchedules.Select(s => new WorkScheduleDto(s.Id, s.ClinicId, clinicName, s.DayOfWeek, s.GetDayOfWeekName(), s.StartTime, s.EndTime, s.IsActive)).ToList(),
                doctor.CreatedAt,
                doctor.UpdatedAt));
        }

        var result = new PagedResult<DoctorDto>(dtos, paged.Page, paged.PageSize, paged.TotalCount);
        return Result<PagedResult<DoctorDto>>.Success(result);
    }
}
