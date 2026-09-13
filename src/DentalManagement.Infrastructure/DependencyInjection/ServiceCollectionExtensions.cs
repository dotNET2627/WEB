using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Infrastructure.Persistence;
using DentalManagement.Infrastructure.Persistence.Indexes;
using DentalManagement.Infrastructure.Persistence.Repositories;
using DentalManagement.Infrastructure.Storage;
using DentalManagement.Infrastructure.Transactions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DentalManagement.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        MongoSerializationConfiguration.Configure();

        services.AddOptions<MongoDbOptions>()
            .BindConfiguration(MongoDbOptions.SectionName)
            .Validate(options => !string.IsNullOrWhiteSpace(options.ConnectionString), "MongoDb:ConnectionString is required.")
            .ValidateOnStart();

        services.AddSingleton<MongoDatabaseContext>();
        services.AddSingleton<MongoSessionAccessor>();
        services.AddSingleton<MongoIndexInitializer>();
        services.AddHostedService<MongoIndexInitializerHostedService>();
        services.AddScoped<IPatientRepository, MongoPatientRepository>();
        services.AddScoped<IAppointmentRepository, MongoAppointmentRepository>();
        services.AddScoped<ITransactionRunner, MongoTransactionRunner>();
        services.AddScoped<IFileStorage, NotConfiguredFileStorage>();

        return services;
    }
}
