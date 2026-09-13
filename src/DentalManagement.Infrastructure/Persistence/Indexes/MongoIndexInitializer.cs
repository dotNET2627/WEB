using DentalManagement.Infrastructure.Persistence.Documents;
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
                    PartialFilterExpression = Builders<PatientDocument>.Filter.Ne(document => document.PatientCode, null),
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
    }
}
