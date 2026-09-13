namespace DentalManagement.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddProblemDetails();

        var frontendOrigin = configuration["Frontend:Origin"] ?? "http://localhost:3000";

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy => policy
                .WithOrigins(frontendOrigin)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials());
        });

        return services;
    }
}
