namespace DentalManagement.Application.Appointments.MarkNoShow;

public sealed record MarkNoShowCommand(Guid ClinicId, Guid AppointmentId);
