using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.ListAppointments;

public sealed class ListAppointmentsHandler
    : IQueryHandler<ListAppointmentsQuery, Result<IReadOnlyList<AppointmentSummaryDto>>>
{
    private readonly IAppointmentRepository _appointments;

    public ListAppointmentsHandler(IAppointmentRepository appointments)
    {
        _appointments = appointments;
    }

    public async Task<Result<IReadOnlyList<AppointmentSummaryDto>>> Handle(
        ListAppointmentsQuery query,
        CancellationToken cancellationToken)
    {
        var appointments = await _appointments.GetByDateRangeAsync(
            query.From,
            query.To,
            query.DoctorId,
            cancellationToken);

        var dtos = appointments
            .Select(a => new AppointmentSummaryDto(
                a.Id,
                a.PatientId,
                PatientName: null,   // enrichment (patient names) can be added later
                a.DoctorId,
                DoctorName: null,    // enrichment (doctor names) can be added later
                a.ClinicId,
                a.StartsAt,
                a.EndsAt,
                a.Status.ToString(),
                a.Reason))
            .ToList();

        return Result<IReadOnlyList<AppointmentSummaryDto>>.Success(dtos);
    }
}
