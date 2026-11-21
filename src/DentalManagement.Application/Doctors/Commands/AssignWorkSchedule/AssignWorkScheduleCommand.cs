using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Doctors;
using FluentValidation;

namespace DentalManagement.Application.Doctors.Commands.AssignWorkSchedule;

public sealed record AssignWorkScheduleCommand(
    Guid DoctorId,
    int DayOfWeek,
    string StartTime,
    string EndTime,
    Guid? ClinicId = null,
    bool IsActive = true);

public sealed class AssignWorkScheduleCommandValidator : AbstractValidator<AssignWorkScheduleCommand>
{
    public AssignWorkScheduleCommandValidator()
    {
        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("ID bác sĩ không được để trống.");

        RuleFor(x => x.DayOfWeek)
            .InclusiveBetween(1, 7).WithMessage("Thứ trong tuần phải từ 1 (Chủ nhật) đến 7 (Thứ bảy).");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Giờ bắt đầu không được để trống.")
            .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("Giờ bắt đầu phải có định dạng HH:mm (00:00 - 23:59).");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("Giờ kết thúc không được để trống.")
            .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("Giờ kết thúc phải có định dạng HH:mm (00:00 - 23:59).");

        RuleFor(x => x)
            .Must(x =>
            {
                if (TimeOnly.TryParse(x.StartTime, out var s) && TimeOnly.TryParse(x.EndTime, out var e))
                {
                    return e > s;
                }
                return true;
            })
            .WithMessage("Giờ kết thúc phải sau giờ bắt đầu.");
    }
}

public sealed class AssignWorkScheduleCommandHandler : ICommandHandler<AssignWorkScheduleCommand, Result<WorkScheduleDto>>
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IClinicRepository _clinicRepository;

    public AssignWorkScheduleCommandHandler(
        IDoctorRepository doctorRepository,
        IClinicRepository clinicRepository)
    {
        _doctorRepository = doctorRepository;
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<WorkScheduleDto>> Handle(AssignWorkScheduleCommand command, CancellationToken cancellationToken)
    {
        var doctor = await _doctorRepository.GetByIdAsync(command.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result<WorkScheduleDto>.Failure("doctor.not_found", "Không tìm thấy thông tin bác sĩ.");
        }

        string? clinicName = null;
        var targetClinicId = command.ClinicId ?? doctor.ClinicId;
        if (targetClinicId.HasValue)
        {
            var clinic = await _clinicRepository.GetByIdAsync(targetClinicId.Value, cancellationToken);
            if (clinic is null)
            {
                return Result<WorkScheduleDto>.Failure("doctor.clinic_not_found", "Không tìm thấy phòng khám được chỉ định cho ca trực.");
            }
            clinicName = clinic.Name;
        }

        var newSchedule = WorkScheduleItem.Create(
            null,
            targetClinicId,
            command.DayOfWeek,
            command.StartTime,
            command.EndTime,
            command.IsActive);

        if (doctor.HasScheduleConflict(newSchedule))
        {
            return Result<WorkScheduleDto>.Failure(
                "doctor.schedule_conflict",
                $"Bác sĩ đã có ca trực trùng thời gian vào {newSchedule.GetDayOfWeekName()} ({newSchedule.StartTime} - {newSchedule.EndTime}).");
        }

        doctor.AddWorkSchedule(newSchedule);
        await _doctorRepository.ReplaceAsync(doctor, cancellationToken);

        var dto = new WorkScheduleDto(
            newSchedule.Id,
            newSchedule.ClinicId,
            clinicName,
            newSchedule.DayOfWeek,
            newSchedule.GetDayOfWeekName(),
            newSchedule.StartTime,
            newSchedule.EndTime,
            newSchedule.IsActive);

        return Result<WorkScheduleDto>.Success(dto);
    }
}
