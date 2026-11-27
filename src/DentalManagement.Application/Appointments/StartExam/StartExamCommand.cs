namespace DentalManagement.Application.Appointments.StartExam;

public sealed record StartExamCommand(Guid ClinicId, Guid AppointmentId);
