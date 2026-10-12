using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.GetTodayAppointments;

public sealed class GetTodayAppointmentsHandler
    : IQueryHandler<GetTodayAppointmentsQuery, Result<IReadOnlyList<TodayAppointmentDto>>>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IPatientRepository _patients;
    private readonly IUserRepository _users;

    public GetTodayAppointmentsHandler(
        IAppointmentRepository appointments,
        IPatientRepository patients,
        IUserRepository users)
    {
        _appointments = appointments;
        _patients = patients;
        _users = users;
    }

    public async Task<Result<IReadOnlyList<TodayAppointmentDto>>> Handle(
        GetTodayAppointmentsQuery query,
        CancellationToken cancellationToken)
    {
        var date = query.Date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var appointments = await _appointments.GetByClinicAndDateAsync(
            query.ClinicId, date, cancellationToken);

        // Batch-load patients and doctors to avoid N+1
        var patientIds = appointments.Select(a => a.PatientId).Distinct().ToList();
        var doctorIds  = appointments.Select(a => a.DoctorId).Distinct().ToList();

        var patients = await _patients.GetByIdsAsync(patientIds, cancellationToken);
        var doctors  = await _users.GetByIdsAsync(doctorIds, cancellationToken);

        var patientMap = patients.ToDictionary(p => p.Id, p => p.FullName);
        var doctorMap  = doctors.ToDictionary(d => d.Id, d => d.FullName);

        var dtos = appointments.Select(a => new TodayAppointmentDto(
            a.Id,
            a.PatientId,
            patientMap.TryGetValue(a.PatientId, out var pName) ? pName : "–",
            a.DoctorId,
            doctorMap.TryGetValue(a.DoctorId, out var dName) ? dName : "–",
            a.StartsAt,
            a.EndsAt,
            a.CheckedInAt,
            a.Status.ToString(),
            a.Reason,
            a.PlannedServices.Select(s => new PlannedServiceItemDto(
                s.ServiceId, s.ServiceName, s.UnitPrice, s.ToothNumber)).ToList()))
        .ToList();

        return Result<IReadOnlyList<TodayAppointmentDto>>.Success(dtos);
    }
}
