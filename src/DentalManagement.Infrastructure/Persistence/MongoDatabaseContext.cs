using DentalManagement.Infrastructure.Persistence.Documents;
using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.Extensions.Options;

namespace DentalManagement.Infrastructure.Persistence;

/// <summary>
/// Infrastructure-only gateway to MongoDB collections. Domain entities never use this type.
/// </summary>
public sealed class MongoDatabaseContext
{
    public MongoDatabaseContext(IOptions<MongoDbOptions> options)
    {
        var value = options.Value;

        if (string.IsNullOrWhiteSpace(value.ConnectionString))
        {
            throw new InvalidOperationException("MongoDb:ConnectionString must be configured.");
        }

        Client = new MongoClient(MongoClientSettings.FromConnectionString(value.ConnectionString));
        Database = Client.GetDatabase(value.DatabaseName);
    }

    public IMongoClient Client { get; }
    public IMongoDatabase Database { get; }

    public IMongoCollection<PatientDocument> Patients => Database.GetCollection<PatientDocument>(CollectionNames.Patients);
    public IMongoCollection<AppointmentDocument> Appointments => Database.GetCollection<AppointmentDocument>(CollectionNames.Appointments);
    public IMongoCollection<InvoiceDocument> Invoices => Database.GetCollection<InvoiceDocument>(CollectionNames.Invoices);
    public IMongoCollection<InventoryBatchDocument> InventoryBatches => Database.GetCollection<InventoryBatchDocument>(CollectionNames.InventoryBatches);
    public IMongoCollection<UserDocument> Users => Database.GetCollection<UserDocument>(CollectionNames.Users);
    public IMongoCollection<RoleDocument> Roles => Database.GetCollection<RoleDocument>(CollectionNames.Roles);
    public IMongoCollection<RefreshTokenDocument> RefreshTokens => Database.GetCollection<RefreshTokenDocument>(CollectionNames.RefreshTokens);
    public IMongoCollection<BsonDocument> AuditLogs => Database.GetCollection<BsonDocument>(CollectionNames.AuditLogs);

    public IMongoCollection<TDocument> GetCollection<TDocument>(string collectionName) =>
        Database.GetCollection<TDocument>(collectionName);
}