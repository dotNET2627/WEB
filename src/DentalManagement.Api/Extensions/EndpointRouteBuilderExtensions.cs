namespace DentalManagement.Api.Extensions;

public static class EndpointRouteBuilderExtensions
{
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/health", () => Results.Ok(new
        {
            status = "healthy",
            service = "DentalManagement.Api"
        }))
        .WithName("HealthCheck")
        .WithTags("System");

        var api = endpoints.MapGroup("/api/v1");
        api.MapGet("/", () => Results.Ok(new
        {
            name = "Dental Management API",
            version = "v1"
        }));

        return endpoints;
    }
}
