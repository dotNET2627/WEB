using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Infrastructure.Caching;
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

        services.AddOptions<DentalManagement.Infrastructure.Security.JwtOptions>()
            .BindConfiguration(DentalManagement.Infrastructure.Security.JwtOptions.SectionName);

        services.AddSingleton<MongoDatabaseContext>();
        services.AddSingleton<MongoSessionAccessor>();
        services.AddSingleton<MongoIndexInitializer>();
        services.AddHostedService<MongoIndexInitializerHostedService>();

        // Redis – IDistributedCache (used for output cache and token blacklist)
        services.AddOptions<RedisOptions>()
            .BindConfiguration(RedisOptions.SectionName)
            .ValidateOnStart();

        services.AddStackExchangeRedisCache(opt =>
        {
            var redisOpts = configuration
                .GetSection(RedisOptions.SectionName)
                .Get<RedisOptions>() ?? new RedisOptions();
            opt.Configuration = redisOpts.ConnectionString;
            opt.InstanceName = redisOpts.InstanceName;
        });

        services.AddSingleton<IClock, DentalManagement.Infrastructure.Services.SystemClock>();
        services.AddSingleton<IPasswordHasher, DentalManagement.Infrastructure.Security.BcryptPasswordHasher>();
        services.AddSingleton<ITokenService, DentalManagement.Infrastructure.Security.JsonWebTokenService>();

        services.AddScoped<IUserRepository, MongoUserRepository>();
        services.AddScoped<IRoleRepository, MongoRoleRepository>();
        services.AddScoped<IRefreshTokenRepository, MongoRefreshTokenRepository>();

        services.AddScoped<IPatientRepository, MongoPatientRepository>();
        services.AddScoped<IClinicRepository, MongoClinicRepository>();
        services.AddScoped<IDoctorRepository, MongoDoctorRepository>();
        services.AddScoped<IAppointmentRepository, MongoAppointmentRepository>();
        services.AddScoped<ITransactionRunner, MongoTransactionRunner>();
        services.AddScoped<IFileStorage, NotConfiguredFileStorage>();

        return services;
    }
}
