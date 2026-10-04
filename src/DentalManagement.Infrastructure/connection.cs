using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Connection
{
    public class MongoDbService
    {
        private readonly IMongoDatabase _database;

public MongoDbService(IConfiguration configuration)
{
    string connectionString =
        configuration["MongoDb:ConnectionString"]
        ?? "mongodb://user123:123456@127.0.0.1:27017/?authSource=admin";

    string databaseName = configuration["MongoDb:DatabaseName"] ?? "clinic";

    var settings = MongoClientSettings.FromConnectionString(connectionString);
    settings.ServerSelectionTimeout = TimeSpan.FromSeconds(5); // báo lỗi nhanh hơn

    var client = new MongoClient(settings);
    _database = client.GetDatabase(databaseName);

    // Ép kết nối ngay để lộ lỗi thật (auth, port, timeout...)
    _database.RunCommand<MongoDB.Bson.BsonDocument>(
        new MongoDB.Bson.BsonDocument("ping", 1));
}
        public IMongoDatabase GetDatabase()
        {
            return _database;
        }
    }
}