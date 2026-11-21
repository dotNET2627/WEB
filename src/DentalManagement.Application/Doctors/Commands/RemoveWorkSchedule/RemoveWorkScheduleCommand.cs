using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Doctors.Commands.RemoveWorkSchedule;

public sealed record RemoveWorkScheduleCommand(Guid DoctorId, Guid ScheduleId);

public sealed class RemoveWorkScheduleCommandHandler : ICommandHandler<RemoveWorkScheduleCommand, Result>
{
    private readonly IDoctorRepository _doctorRepository;

    public RemoveWorkScheduleCommandHandler(IDoctorRepository doctorRepository)
    {
        _doctorRepository = doctorRepository;
    }

    public async Task<Result> Handle(RemoveWorkScheduleCommand command, CancellationToken cancellationToken)
    {
        var doctor = await _doctorRepository.GetByIdAsync(command.DoctorId, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure("doctor.not_found", "Không tìm thấy thông tin bác sĩ.");
        }

        var removed = doctor.RemoveWorkSchedule(command.ScheduleId);
        if (!removed)
        {
            return Result.Failure("doctor.schedule_not_found", "Không tìm thấy ca trực cần xóa trong lịch của bác sĩ.");
        }

        await _doctorRepository.ReplaceAsync(doctor, cancellationToken);
        return Result.Success();
    }
}
