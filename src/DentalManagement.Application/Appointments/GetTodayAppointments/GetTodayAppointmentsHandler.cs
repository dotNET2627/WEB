using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.GetTodayAppointments;

public sealed class GetTodayAppointmentsHandler
    : IQueryHandler<GetTodayAppointmentsQuery, Result<IReadOnlyList<TodayAppointmentDto>>>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IPatientRepository _patients;
    private readonly IDoctorRepository _doctors;
    private readonly IUserRepository _users;

    public GetTodayAppointmentsHandler(
        IAppointmentRepository appointments,
        IPatientRepository patients,
        IDoctorRepository doctors,
        IUserRepository users)
    {
        _appointments = appointments;
        _patients = patients;
        _doctors = doctors;
        _users = users;
    }

    public async Task<Result<IReadOnlyList<TodayAppointmentDto>>> Handle(
        GetTodayAppointmentsQuery query,
        CancellationToken cancellationToken)
    {
        var date = query.Date ?? DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).DateTime);

        var appointments = await _appointments.GetByClinicAndDateAsync(
            query.ClinicId, date, cancellationToken);

        // Batch-load patients and doctors to avoid N+1
        var patientIds = appointments.Select(a => a.PatientId).Distinct().ToList();
        var doctorIds  = appointments.Select(a => a.DoctorId).Distinct().ToList();

        var patients = await _patients.GetByIdsAsync(query.ClinicId, patientIds, cancellationToken);
        var doctors = await _doctors.GetByIdsAsync(doctorIds, cancellationToken);
        var users = await _users.GetByIdsAsync(doctors.Select(doctor => doctor.UserId).Distinct(), cancellationToken);

        var patientMap = patients.ToDictionary(p => p.Id, p => p.FullName);
        var userNames = users.ToDictionary(user => user.Id, user => user.FullName);
        var doctorMap = doctors.ToDictionary(doctor => doctor.Id, doctor => userNames.GetValueOrDefault(doctor.UserId, "–"));

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
