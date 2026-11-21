using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Appointments;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoAppointmentRepository : IAppointmentRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoAppointmentRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Appointment?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.Appointments
            .Find(document => document.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : AppointmentDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<Appointment>> GetByDateRangeAsync(
        DateTimeOffset from,
        DateTimeOffset to,
        Guid? doctorId,
        CancellationToken cancellationToken)
    {
        var builder = Builders<AppointmentDocument>.Filter;

        // Appointment overlaps [from, to] if: StartsAt < to AND (EndsAt is null OR EndsAt > from)
        var filter = builder.And(
            builder.Lt(d => d.StartsAt, to),
            builder.Or(
                builder.Eq(d => d.EndsAt, null),
                builder.Gt(d => d.EndsAt, from)));

        if (doctorId is not null)
            filter &= builder.Eq(d => d.DoctorId, doctorId.Value);

        var documents = _sessionAccessor.Current is { } session
            ? await _context.Appointments.Find(session, filter).ToListAsync(cancellationToken)
            : await _context.Appointments.Find(filter).ToListAsync(cancellationToken);

        return documents.Select(AppointmentDocumentMapper.ToDomain).ToList();
    }

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
            builder.Ne(document => document.Status, nameof(AppointmentStatus.Cancelled)),
            builder.Lt(document => document.StartsAt, requestedEnd),
            builder.Or(
                builder.Eq(document => document.EndsAt, null),
                builder.Gt(document => document.EndsAt, startsAt)));

        if (excludingAppointmentId is not null)
        {
            filter &= builder.Ne(document => document.Id, excludingAppointmentId.Value);
        }

        if (_sessionAccessor.Current is { } session)
        {
            return await _context.Appointments.Find(session, filter).AnyAsync(cancellationToken);
        }

        return await _context.Appointments.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task AddAsync(Appointment appointment, CancellationToken cancellationToken)
    {
        var document = AppointmentDocumentMapper.ToDocument(appointment);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Appointments.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Appointments.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(Appointment appointment, CancellationToken cancellationToken)
    {
        var document = AppointmentDocumentMapper.ToDocument(appointment);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Appointments.ReplaceOneAsync(session, current => current.Id == appointment.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Appointments.ReplaceOneAsync(current => current.Id == appointment.Id, document, cancellationToken: cancellationToken);
    }
}
