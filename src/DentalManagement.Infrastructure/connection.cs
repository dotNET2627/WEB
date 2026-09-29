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
                ?? "mongodb://user123:123456@localhost:27017/?authSource=admin";

            string databaseName =
                configuration["MongoDb:DatabaseName"]
                ?? "clinic";

            MongoClient client = new MongoClient(connectionString);

            _database = client.GetDatabase(databaseName);
        }

        public IMongoDatabase GetDatabase()
        {
            return _database;
        }
    }
}