using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Doctors.Commands.DeleteDoctor;

public sealed record DeleteDoctorCommand(Guid Id);

public sealed class DeleteDoctorCommandHandler : ICommandHandler<DeleteDoctorCommand, Result>
{
    private readonly IDoctorRepository _doctorRepository;

    public DeleteDoctorCommandHandler(IDoctorRepository doctorRepository)
    {
        _doctorRepository = doctorRepository;
    }

    public async Task<Result> Handle(DeleteDoctorCommand command, CancellationToken cancellationToken)
    {
        var doctor = await _doctorRepository.GetByIdAsync(command.Id, cancellationToken);
        if (doctor is null)
        {
            return Result.Failure("doctor.not_found", "Không tìm thấy thông tin bác sĩ cần xóa.");
        }

        await _doctorRepository.DeleteAsync(command.Id, cancellationToken);
        return Result.Success();
    }
}
