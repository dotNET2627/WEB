using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Doctors;
using FluentValidation;

namespace DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules;

public sealed record SetDoctorWorkSchedulesCommand(
    Guid DoctorId,
    IEnumerable<WorkScheduleInputDto> Schedules);

public sealed record WorkScheduleInputDto(
    Guid? Id,
    Guid? ClinicId,
    int DayOfWeek,
    string StartTime,
    string EndTime,
    bool IsActive = true);

public sealed class SetDoctorWorkSchedulesCommandValidator : AbstractValidator<SetDoctorWorkSchedulesCommand>
{
    public SetDoctorWorkSchedulesCommandValidator()
    {
        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("ID bác sĩ không được để trống.");

        RuleForEach(x => x.Schedules).ChildRules(schedule =>
        {
            schedule.RuleFor(s => s.DayOfWeek)
                .InclusiveBetween(1, 7).WithMessage("Thứ trong tuần phải từ 1 (Chủ nhật) đến 7 (Thứ bảy).");

            schedule.RuleFor(s => s.StartTime)
                .NotEmpty().WithMessage("Giờ bắt đầu không được để trống.")
                .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("Giờ bắt đầu phải có định dạng HH:mm (00:00 - 23:59).");

            schedule.RuleFor(s => s.EndTime)
                .NotEmpty().WithMessage("Giờ kết thúc không được để trống.")
                .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("Giờ kết thúc phải có định dạng HH:mm (00:00 - 23:59).");

            schedule.RuleFor(s => s)
                .Must(s =>
                {
                    if (TimeOnly.TryParse(s.StartTime, out var start) && TimeOnly.TryParse(s.EndTime, out var end))
                    {
                        return end > start;
                    }
                    return true;
                })
                .WithMessage("Giờ kết thúc phải sau giờ bắt đầu.");
        });
    }
}

public sealed class SetDoctorWorkSchedulesCommandHandler : ICommandHandler<SetDoctorWorkSchedulesCommand, Result<IReadOnlyList<WorkScheduleDto>>>
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IClinicRepository _clinicRepository;

    public SetDoctorWorkSchedulesCommandHandler(
        IDoctorRepository doctorRepository,
        IClinicRepository clinicRepository)
    {
        _doctorRepository = doctorRepository;
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<IReadOnlyList<WorkScheduleDto>>> Handle(SetDoctorWorkSchedulesCommand command, CancellationToken cancellationToken)
    {
        var doctor = await _doctorRepository.GetByIdAsync(command.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result<IReadOnlyList<WorkScheduleDto>>.Failure("doctor.not_found", "Không tìm thấy thông tin bác sĩ.");
        }

        var newScheduleItems = new List<WorkScheduleItem>();
        var clinicNames = new Dictionary<Guid, string>();

        foreach (var input in command.Schedules)
        {
            var clinicId = input.ClinicId ?? doctor.ClinicId;
            if (clinicId.HasValue && !clinicNames.ContainsKey(clinicId.Value))
            {
                var clinic = await _clinicRepository.GetByIdAsync(clinicId.Value, cancellationToken);
                if (clinic is null)
                {
                    return Result<IReadOnlyList<WorkScheduleDto>>.Failure("doctor.clinic_not_found", $"Không tìm thấy phòng khám với ID: {clinicId.Value}");
                }
                clinicNames[clinicId.Value] = clinic.Name;
            }

            var item = WorkScheduleItem.Create(
                input.Id,
                clinicId,
                input.DayOfWeek,
                input.StartTime,
                input.EndTime,
                input.IsActive);

            newScheduleItems.Add(item);
        }

        try
        {
            doctor.SetWorkSchedules(newScheduleItems);
        }
        catch (InvalidOperationException ex)
        {
            return Result<IReadOnlyList<WorkScheduleDto>>.Failure("doctor.schedule_conflict", ex.Message);
        }

        await _doctorRepository.ReplaceAsync(doctor, cancellationToken);

        var dtos = doctor.WorkSchedules.Select(s => new WorkScheduleDto(
            s.Id,
            s.ClinicId,
            s.ClinicId.HasValue && clinicNames.TryGetValue(s.ClinicId.Value, out var name) ? name : null,
            s.DayOfWeek,
            s.GetDayOfWeekName(),
            s.StartTime,
            s.EndTime,
            s.IsActive)).ToList();

        return Result<IReadOnlyList<WorkScheduleDto>>.Success(dtos);
    }
}
