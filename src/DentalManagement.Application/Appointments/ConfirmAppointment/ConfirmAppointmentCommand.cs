namespace DentalManagement.Application.Appointments.ConfirmAppointment;

public sealed record ConfirmAppointmentCommand(Guid ClinicId, Guid AppointmentId);
