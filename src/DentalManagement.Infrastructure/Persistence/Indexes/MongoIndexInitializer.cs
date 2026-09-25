using DentalManagement.Infrastructure.Persistence.Documents;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Indexes;

public sealed class MongoIndexInitializer
{
    private readonly MongoDatabaseContext _context;

    public MongoIndexInitializer(MongoDatabaseContext context)
    {
        _context = context;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await _context.Patients.Indexes.CreateOneAsync(
            new CreateIndexModel<PatientDocument>(
                Builders<PatientDocument>.IndexKeys.Ascending(document => document.ClinicId).Ascending(document => document.PatientCode),
                new CreateIndexOptions<PatientDocument>
                {
                    Unique = true,
                    PartialFilterExpression = Builders<PatientDocument>.Filter.Type(document => document.PatientCode, BsonType.String),
                    Name = "uq_patients_clinic_patient_code"
                }),
            cancellationToken: cancellationToken);

        await _context.Appointments.Indexes.CreateOneAsync(
            new CreateIndexModel<AppointmentDocument>(
                Builders<AppointmentDocument>.IndexKeys.Ascending(document => document.ClinicId).Ascending(document => document.DoctorId).Ascending(document => document.StartsAt),
                new CreateIndexOptions { Name = "ix_appointments_clinic_doctor_starts_at" }),
            cancellationToken: cancellationToken);

        await _context.InventoryBatches.Indexes.CreateOneAsync(
            new CreateIndexModel<InventoryBatchDocument>(
                Builders<InventoryBatchDocument>.IndexKeys.Ascending(document => document.ClinicId).Ascending(document => document.InventoryItemId).Ascending(document => document.ExpirationDate),
                new CreateIndexOptions { Name = "ix_inventory_batches_fefo" }),
            cancellationToken: cancellationToken);

        await _context.Users.Indexes.CreateOneAsync(
            new CreateIndexModel<UserDocument>(
                Builders<UserDocument>.IndexKeys.Ascending(document => document.Email),
                new CreateIndexOptions { Unique = true, Name = "uq_users_email" }),
            cancellationToken: cancellationToken);

        await _context.Roles.Indexes.CreateOneAsync(
            new CreateIndexModel<RoleDocument>(
                Builders<RoleDocument>.IndexKeys.Ascending(document => document.Name),
                new CreateIndexOptions { Unique = true, Name = "uq_roles_name" }),
            cancellationToken: cancellationToken);

        await _context.RefreshTokens.Indexes.CreateOneAsync(
            new CreateIndexModel<RefreshTokenDocument>(
                Builders<RefreshTokenDocument>.IndexKeys.Ascending(document => document.TokenHash),
                new CreateIndexOptions { Unique = true, Name = "uq_refresh_tokens_token_hash" }),
            cancellationToken: cancellationToken);

        await _context.RefreshTokens.Indexes.CreateOneAsync(
            new CreateIndexModel<RefreshTokenDocument>(
                Builders<RefreshTokenDocument>.IndexKeys.Ascending(document => document.UserId),
                new CreateIndexOptions { Name = "ix_refresh_tokens_user_id" }),
            cancellationToken: cancellationToken);

        await _context.RefreshTokens.Indexes.CreateOneAsync(
            new CreateIndexModel<RefreshTokenDocument>(
                Builders<RefreshTokenDocument>.IndexKeys.Ascending(document => document.ExpiresAt),
                new CreateIndexOptions { ExpireAfter = TimeSpan.Zero, Name = "ttl_refresh_tokens_expires_at" }),
            cancellationToken: cancellationToken);
    }
}