using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Doctors.Queries.GetDoctorWorkSchedules;

public sealed record GetDoctorWorkSchedulesQuery(Guid DoctorId);

public sealed class GetDoctorWorkSchedulesQueryHandler : IQueryHandler<GetDoctorWorkSchedulesQuery, Result<IReadOnlyList<WorkScheduleDto>>>
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IClinicRepository _clinicRepository;

    public GetDoctorWorkSchedulesQueryHandler(
        IDoctorRepository doctorRepository,
        IClinicRepository clinicRepository)
    {
        _doctorRepository = doctorRepository;
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<IReadOnlyList<WorkScheduleDto>>> Handle(GetDoctorWorkSchedulesQuery query, CancellationToken cancellationToken)
    {
        var doctor = await _doctorRepository.GetByIdAsync(query.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result<IReadOnlyList<WorkScheduleDto>>.Failure("doctor.not_found", "Không tìm thấy thông tin bác sĩ.");
        }

        var dtos = new List<WorkScheduleDto>();
        foreach (var s in doctor.WorkSchedules.OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime))
        {
            string? clinicName = null;
            if (s.ClinicId.HasValue)
            {
                var clinic = await _clinicRepository.GetByIdAsync(s.ClinicId.Value, cancellationToken);
                clinicName = clinic?.Name;
            }

            dtos.Add(new WorkScheduleDto(
                s.Id,
                s.ClinicId,
                clinicName,
                s.DayOfWeek,
                s.GetDayOfWeekName(),
                s.StartTime,
                s.EndTime,
                s.IsActive));
        }

        return Result<IReadOnlyList<WorkScheduleDto>>.Success(dtos);
    }
}
