using DentalManagement.Domain.Appointments;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IAppointmentRepository
{
    Task<Appointment?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> HasDoctorConflictAsync(
        Guid doctorId,
        DateTimeOffset startsAt,
        DateTimeOffset? endsAt,
        Guid? excludingAppointmentId,
        CancellationToken cancellationToken);
    Task AddAsync(Appointment appointment, CancellationToken cancellationToken);
    Task ReplaceAsync(Appointment appointment, CancellationToken cancellationToken);
}
