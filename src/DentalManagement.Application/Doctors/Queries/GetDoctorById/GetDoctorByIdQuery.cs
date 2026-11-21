using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Doctors.Queries.GetDoctorById;

public sealed record GetDoctorByIdQuery(Guid Id);

public sealed class GetDoctorByIdQueryHandler : IQueryHandler<GetDoctorByIdQuery, Result<DoctorDto>>
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClinicRepository _clinicRepository;

    public GetDoctorByIdQueryHandler(
        IDoctorRepository doctorRepository,
        IUserRepository userRepository,
        IClinicRepository clinicRepository)
    {
        _doctorRepository = doctorRepository;
        _userRepository = userRepository;
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<DoctorDto>> Handle(GetDoctorByIdQuery query, CancellationToken cancellationToken)
    {
        var doctor = await _doctorRepository.GetByIdAsync(query.Id, cancellationToken);
        if (doctor is null)
        {
            return Result<DoctorDto>.Failure("doctor.not_found", "Không tìm thấy thông tin bác sĩ.");
        }

        var user = await _userRepository.GetByIdAsync(doctor.UserId, cancellationToken);

        string? clinicName = null;
        if (doctor.ClinicId.HasValue)
        {
            var clinic = await _clinicRepository.GetByIdAsync(doctor.ClinicId.Value, cancellationToken);
            clinicName = clinic?.Name;
        }

        var dto = new DoctorDto(
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
            doctor.UpdatedAt);

        return Result<DoctorDto>.Success(dto);
    }
}
