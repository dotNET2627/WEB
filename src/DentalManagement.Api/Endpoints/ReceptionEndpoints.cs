using DentalManagement.Application.Appointments.GetTodayAppointments;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class ReceptionEndpoints
{
    public static IEndpointRouteBuilder MapReceptionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/reception")
            .WithTags("Reception");

        // GET /api/v1/reception/today?clinicId=&date= — lịch hẹn hôm nay (màn hình tiếp đón)
        group.MapGet("/today", async (
            Guid clinicId,
            DateOnly? date,
            IQueryHandler<GetTodayAppointmentsQuery, Result<IReadOnlyList<TodayAppointmentDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(
                new GetTodayAppointmentsQuery(clinicId, date), cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(
                    statusCode: StatusCodes.Status500InternalServerError,
                    detail: result.Error!.Message);
        })
        .WithName("GetTodayAppointments")
        .RequireAuthorization(DefaultPermissions.Reception.Read);

        return endpoints;
    }
}
