using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Clinics.Commands.DeleteClinic;

public sealed record DeleteClinicCommand(Guid Id);

public sealed class DeleteClinicCommandHandler : ICommandHandler<DeleteClinicCommand, Result>
{
    private readonly IClinicRepository _clinicRepository;

    public DeleteClinicCommandHandler(IClinicRepository clinicRepository)
    {
        _clinicRepository = clinicRepository;
    }

    public async Task<Result> Handle(DeleteClinicCommand command, CancellationToken cancellationToken)
    {
        var clinic = await _clinicRepository.GetByIdAsync(command.Id, cancellationToken);
        if (clinic is null)
        {
            return Result.Failure("clinic.not_found", "Không tìm thấy thông tin phòng khám cần xóa.");
        }

        await _clinicRepository.DeleteAsync(command.Id, cancellationToken);
        return Result.Success();
    }
}
