using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Appointments;
using DentalManagement.Infrastructure.Persistence.Documents;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoAppointmentRepository : IAppointmentRepository
{
    private readonly MongoDatabaseContext _context;

    public MongoAppointmentRepository(MongoDatabaseContext context)
    {
        _context = context;
    }

    public Task<Appointment?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        throw new NotImplementedException("Add an AppointmentDocument-to-domain mapper when appointment use cases are implemented.");

    public async Task<bool> HasDoctorConflictAsync(
        Guid doctorId,
        DateTimeOffset startsAt,
        DateTimeOffset? endsAt,
        Guid? excludingAppointmentId,
        CancellationToken cancellationToken)
    {
        var requestedEnd = endsAt ?? startsAt.AddMinutes(30);
        var builder = Builders<AppointmentDocument>.Filter;
        var filter = builder.And(
            builder.Eq(document => document.DoctorId, doctorId),
            builder.Ne(document => document.Status, "Cancelled"),
            builder.Lt(document => document.StartsAt, requestedEnd),
            builder.Or(
                builder.Eq(document => document.EndsAt, null),
                builder.Gt(document => document.EndsAt, startsAt)));

        if (excludingAppointmentId is not null)
        {
            filter &= builder.Ne(document => document.Id, excludingAppointmentId.Value);
        }

        return await _context.Appointments.Find(filter).AnyAsync(cancellationToken);
    }

    public Task AddAsync(Appointment appointment, CancellationToken cancellationToken) =>
        throw new NotImplementedException("Add appointment persistence mapping with planned service snapshots.");

    public Task ReplaceAsync(Appointment appointment, CancellationToken cancellationToken) =>
        throw new NotImplementedException("Add appointment persistence mapping with planned service snapshots.");
}
