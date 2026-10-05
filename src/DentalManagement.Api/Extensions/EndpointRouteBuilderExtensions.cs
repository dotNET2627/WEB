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
        endpoints.MapClinicEndpoints();
        endpoints.MapDoctorEndpoints();

        // Demonstration of Dynamic Permission Policy
        api.MapGet("/patients-demo", () => Results.Ok(new[]
        {
            new { id = Guid.NewGuid(), fullName = "Nguyễn Văn A", patientCode = "BN001" },
            new { id = Guid.NewGuid(), fullName = "Trần Thị B", patientCode = "BN002" }
        }))
        .RequireAuthorization("patients.read")
        .WithTags("Patients");

        return endpoints;
    }
}