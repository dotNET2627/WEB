using DentalManagement.Application.Appointments;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class AppointmentEndpoints
{
    public static IEndpointRouteBuilder MapAppointmentEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/appointments")
            .WithTags("Appointments")
            .RequireAuthorization();

        // 1. Tạo lịch hẹn.
        group.MapPost("/", async (
            CreateAppointmentRequest request,
            [FromServices] AppointmentService service,
            CancellationToken cancellationToken) =>
        {
            var plannedServices = request.PlannedServices?
                .Select(item => item is null
                    ? null!
                    : new PlannedServiceItem(
                        item.ServiceId,
                        item.ServiceName,
                        item.UnitPrice,
                        item.ToothNumber))
                .ToArray() ?? [];

            var command = new CreateAppointmentCommand(
                request.PatientId,
                request.DoctorId,
                request.ClinicId,
                request.StartsAt,
                request.EndsAt,
                request.Reason,
                plannedServices);

            var result = await service.CreateAsync(
                command,
                cancellationToken);

            if (result.IsFailure)
            {
                return ToProblem(result.Error!);
            }

            return Results.Created(
                $"/api/v1/appointments/{result.Value}",
                new AppointmentCreatedResponse(
                    result.Value,
                    "Đặt lịch hẹn thành công."));
        })
        .WithName("CreateAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Create);

        // 2. Lấy chi tiết lịch hẹn.
        group.MapGet("/{id:guid}", async (
            Guid id,
            [FromServices] AppointmentService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.GetByIdAsync(
                new GetAppointmentQuery(id),
                cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetAppointmentById")
        .RequireAuthorization(DefaultPermissions.Appointments.Read);

        // 3. Danh sách lịch hẹn theo khoảng thời gian.
        group.MapGet("/", async (
            DateTimeOffset from,
            DateTimeOffset to,
            Guid? doctorId,
            [FromServices] AppointmentService service,
            CancellationToken cancellationToken) =>
        {
            var query = new ListAppointmentsQuery(
                from,
                to,
                doctorId);

            var result = await service.GetListAsync(
                query,
                cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("ListAppointments")
        .RequireAuthorization(DefaultPermissions.Appointments.Read);

        // 4. Đổi thời gian và cập nhật lý do.
        group.MapPut("/{id:guid}", async (
            Guid id,
            RescheduleAppointmentRequest request,
            [FromServices] AppointmentService service,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateAppointmentCommand(
                id,
                request.StartsAt,
                request.EndsAt,
                request.Reason);

            var result = await service.UpdateAsync(
                command,
                cancellationToken);

            return result.IsSuccess
                ? Results.NoContent()
                : ToProblem(result.Error!);
        })
        .WithName("RescheduleAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Update);

        // 5. Xác nhận lịch hẹn.
        group.MapPost("/{id:guid}/confirm", async (
            Guid id,
            [FromServices] AppointmentService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.ConfirmAsync(
                new ConfirmAppointmentCommand(id),
                cancellationToken);

            return result.IsSuccess
                ? Results.NoContent()
                : ToProblem(result.Error!);
        })
        .WithName("ConfirmAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Update);

        // 6. Hủy lịch hẹn.
        group.MapPost("/{id:guid}/cancel", async (
            Guid id,
            [FromServices] AppointmentService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.CancelAsync(
                new CancelAppointmentCommand(id),
                cancellationToken);

            return result.IsSuccess
                ? Results.NoContent()
                : ToProblem(result.Error!);
        })
        .WithName("CancelAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Cancel);

        return endpoints;
    }

    private static IResult ToProblem(Error error)
    {
        var statusCode = error.Code switch
        {
            "appointment.not_found"
                => StatusCodes.Status404NotFound,

            "appointment.conflict" or
            "appointment.invalid_state"
                => StatusCodes.Status409Conflict,

            _ => StatusCodes.Status400BadRequest
        };

        return Results.Problem(
            statusCode: statusCode,
            title: "Không thể xử lý lịch hẹn",
            detail: error.Message,
            extensions: new Dictionary<string, object?>
            {
                ["code"] = error.Code
            });
    }
}

public sealed record CreateAppointmentRequest(
    Guid PatientId,
    Guid DoctorId,
    Guid ClinicId,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? Reason,
    IReadOnlyList<PlannedServiceItemRequest>? PlannedServices);

public sealed record PlannedServiceItemRequest(
    Guid ServiceId,
    string ServiceName,
    decimal UnitPrice,
    string? ToothNumber);

public sealed record RescheduleAppointmentRequest(
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? Reason);

public sealed record AppointmentCreatedResponse(
    Guid Id,
    string Message);