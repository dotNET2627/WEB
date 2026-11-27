namespace DentalManagement.Application.Appointments.CompleteAppointment;

public sealed record CompleteAppointmentCommand(Guid ClinicId, Guid AppointmentId);
