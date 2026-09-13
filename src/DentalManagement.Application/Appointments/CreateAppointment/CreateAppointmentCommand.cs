namespace DentalManagement.Application.Appointments.CreateAppointment;

public sealed record CreateAppointmentCommand(
    Guid PatientId,
    Guid DoctorId,
    Guid ClinicId,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? Reason);
