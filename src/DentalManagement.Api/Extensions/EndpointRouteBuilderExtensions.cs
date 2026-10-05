using DentalManagement.Api.Endpoints;

namespace DentalManagement.Api.Extensions;

public static class EndpointRouteBuilderExtensions
{
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var api = endpoints.MapGroup("/api/v1");
        api.MapGet("/", () => Results.Ok(new
        {
            name = "Dental Management API",
            version = "v1"
        }));

        endpoints.MapAuthEndpoints();

        endpoints.MapPatientEndpoints();

        return endpoints;
    }
}