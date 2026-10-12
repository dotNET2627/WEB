using DentalManagement.Application.Appointments.CancelAppointment;
using DentalManagement.Application.Appointments.CheckInAppointment;
using DentalManagement.Application.Appointments.CompleteAppointment;
using DentalManagement.Application.Appointments.ConfirmAppointment;
using DentalManagement.Application.Appointments.CreateAppointment;
using DentalManagement.Application.Appointments.GetAppointment;
using DentalManagement.Application.Appointments.ListAppointments;
using DentalManagement.Application.Appointments.MarkNoShow;
using DentalManagement.Application.Appointments.StartExam;
using DentalManagement.Application.Appointments.UpdateAppointment;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using FluentValidation;

namespace DentalManagement.Api.Endpoints;

public static class AppointmentEndpoints
{
    public static IEndpointRouteBuilder MapAppointmentEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/appointments")
            .WithTags("Appointments");

        // 1. Create Appointment
        group.MapPost("/", async (
            CreateAppointmentRequest request,
            ICommandHandler<CreateAppointmentCommand, Result<Guid>> handler,
            IValidator<CreateAppointmentCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var plannedServices = request.PlannedServices?
                .Select(s => new PlannedServiceItem(s.ServiceId, s.ServiceName, s.UnitPrice, s.ToothNumber))
                .ToList() ?? [];

            var command = new CreateAppointmentCommand(
                request.PatientId,
                request.DoctorId,
                request.ClinicId,
                request.StartsAt,
                request.EndsAt,
                request.Reason,
                plannedServices);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "appointment.conflict" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng lịch hẹn",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể tạo lịch hẹn",
                        detail: error.Message)
                };
            }

            return Results.Created($"/api/v1/appointments/{result.Value}", new
            {
                id = result.Value,
                message = "Đặt lịch hẹn thành công."
            });
        })
        .WithName("CreateAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Create);

        // 2. Get Appointment By Id
        group.MapGet("/{id:guid}", async (
            Guid id,
            IQueryHandler<GetAppointmentQuery, Result<AppointmentDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetAppointmentQuery(id), cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Không tìm thấy lịch hẹn",
                    detail: result.Error!.Message);
        })
        .WithName("GetAppointmentById")
        .RequireAuthorization(DefaultPermissions.Appointments.Read);

        // 3. List Appointments by Date Range
        group.MapGet("/", async (
            DateTimeOffset from,
            DateTimeOffset to,
            Guid? doctorId,
            IQueryHandler<ListAppointmentsQuery, Result<IReadOnlyList<AppointmentSummaryDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new ListAppointmentsQuery(from, to, doctorId), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Error!.Message);
        })
        .WithName("ListAppointments")
        .RequireAuthorization(DefaultPermissions.Appointments.Read);

        // 4. Reschedule Appointment (Drag & Drop)
        group.MapPut("/{id:guid}", async (
            Guid id,
            RescheduleAppointmentRequest request,
            ICommandHandler<UpdateAppointmentCommand, Result> handler,
            IValidator<UpdateAppointmentCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateAppointmentCommand(id, request.StartsAt, request.EndsAt, request.Reason);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
                return Results.ValidationProblem(validationResult.ToDictionary());

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "appointment.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy lịch hẹn",
                        detail: error.Message),
                    "appointment.conflict" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng lịch hẹn",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể cập nhật lịch hẹn",
                        detail: error.Message)
                };
            }

            return Results.NoContent();
        })
        .WithName("RescheduleAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Update);

        // 5. Check-in (Confirmed → CheckedIn)
        group.MapPatch("/{id:guid}/check-in", async (
            Guid id,
            ICommandHandler<CheckInAppointmentCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new CheckInAppointmentCommand(id), cancellationToken);
            return result.IsSuccess
                ? Results.NoContent()
                : MapStatusError(result.Error!);
        })
        .WithName("CheckInAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.CheckIn);

        // 6. Start Exam (CheckedIn → InProgress)
        group.MapPatch("/{id:guid}/start-exam", async (
            Guid id,
            ICommandHandler<StartExamCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new StartExamCommand(id), cancellationToken);
            return result.IsSuccess
                ? Results.NoContent()
                : MapStatusError(result.Error!);
        })
        .WithName("StartExam")
        .RequireAuthorization(DefaultPermissions.Appointments.CheckIn);

        // 7. Complete (InProgress → Completed)
        group.MapPatch("/{id:guid}/complete", async (
            Guid id,
            ICommandHandler<CompleteAppointmentCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new CompleteAppointmentCommand(id), cancellationToken);
            return result.IsSuccess
                ? Results.NoContent()
                : MapStatusError(result.Error!);
        })
        .WithName("CompleteAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.CheckIn);

        // 8. No-Show (Confirmed/CheckedIn → NoShow)
        group.MapPatch("/{id:guid}/no-show", async (
            Guid id,
            ICommandHandler<MarkNoShowCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new MarkNoShowCommand(id), cancellationToken);
            return result.IsSuccess
                ? Results.NoContent()
                : MapStatusError(result.Error!);
        })
        .WithName("MarkNoShow")
        .RequireAuthorization(DefaultPermissions.Appointments.CheckIn);

        // 9. Confirm (Pending → Confirmed)
        group.MapPatch("/{id:guid}/confirm", async (
            Guid id,
            ICommandHandler<ConfirmAppointmentCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new ConfirmAppointmentCommand(id), cancellationToken);
            return result.IsSuccess
                ? Results.NoContent()
                : MapStatusError(result.Error!);
        })
        .WithName("ConfirmAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Update);

        // 10. Cancel (Pending/Confirmed/CheckedIn → Cancelled)
        group.MapPatch("/{id:guid}/cancel", async (
            Guid id,
            ICommandHandler<CancelAppointmentCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new CancelAppointmentCommand(id), cancellationToken);
            return result.IsSuccess
                ? Results.NoContent()
                : MapStatusError(result.Error!);
        })
        .WithName("CancelAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Cancel);

        return endpoints;
    }

    private static IResult MapStatusError(DentalManagement.Domain.Common.Error error) =>
        error.Code switch
        {
            "appointment.not_found" => Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Không tìm thấy lịch hẹn",
                detail: error.Message),
            "appointment.invalid_state" => Results.Problem(
                statusCode: StatusCodes.Status422UnprocessableEntity,
                title: "Trạng thái không hợp lệ",
                detail: error.Message),
            _ => Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: error.Message)
        };
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
