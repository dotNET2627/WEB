namespace DentalManagement.Application.Appointments.CheckInAppointment;

public sealed record CheckInAppointmentCommand(Guid ClinicId, Guid AppointmentId);
