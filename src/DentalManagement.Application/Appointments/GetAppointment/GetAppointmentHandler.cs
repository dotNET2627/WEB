using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.GetAppointment;

public sealed class GetAppointmentHandler
    : IQueryHandler<GetAppointmentQuery, Result<AppointmentDto>>
{
    private readonly IAppointmentRepository _appointments;

    public GetAppointmentHandler(IAppointmentRepository appointments)
    {
        _appointments = appointments;
    }

    public async Task<Result<AppointmentDto>> Handle(
        GetAppointmentQuery query,
        CancellationToken cancellationToken)
    {
        var appointment = await _appointments.GetByIdAsync(query.AppointmentId, cancellationToken);

        if (appointment is null)
        {
            return Result<AppointmentDto>.Failure(
                "appointment.not_found",
                $"Không tìm thấy lịch hẹn với id '{query.AppointmentId}'.");
        }

        return Result<AppointmentDto>.Success(AppointmentDtoMapper.ToDto(appointment));
    }
}
