using DentalManagement.Api.Extensions;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Appointments.CancelAppointment;
using DentalManagement.Application.Appointments.ConfirmAppointment;
using DentalManagement.Application.Appointments.CreateAppointment;
using DentalManagement.Application.Appointments.GetAppointment;
using DentalManagement.Application.Appointments.ListAppointments;
using DentalManagement.Application.Appointments.UpdateAppointment;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class AppointmentEndpoints
{
    public static IEndpointRouteBuilder MapAppointmentEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/appointments")
            .WithTags("Appointments")
            .RequireAuthorization();

        // Bảo vệ dữ liệu đa chi nhánh: yêu cầu người dùng phải thuộc phòng khám hợp lệ
        group.RequireClinic();

        // 1. Create Appointment
        group.MapPost("/", async (
            CreateAppointmentRequest request,
            [FromServices] ICurrentUser user,
            ICommandHandler<CreateAppointmentCommand, Result<Guid>> handler,
            IValidator<CreateAppointmentCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var plannedServices = request.PlannedServices?
                .Select(s => new PlannedServiceItem(s.ServiceId, s.ServiceName, s.UnitPrice, s.ToothNumber))
                .ToList() ?? [];

            // Luôn đảm bảo ClinicId lấy từ phiên đăng nhập của người dùng
            var clinicId = user.ClinicId!.Value;

            var command = new CreateAppointmentCommand(
                request.PatientId,
                request.DoctorId,
                clinicId,
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
        .RequireAuthorization(DefaultPermissions.Appointments.Create)
        .Produces(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // 2. Get Appointment By Id
        group.MapGet("/{id:guid}", async (
            Guid id,
            [FromServices] ICurrentUser user,
            IQueryHandler<GetAppointmentQuery, Result<AppointmentDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetAppointmentQuery(id), cancellationToken);

            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Không tìm thấy lịch hẹn",
                    detail: result.Error!.Message);
            }

            // Cách ly đa chi nhánh: ngăn chặn xem lịch hẹn của phòng khám khác
            if (result.Value!.ClinicId != user.ClinicId!.Value)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Không tìm thấy lịch hẹn",
                    detail: "Lịch hẹn không thuộc phòng khám đang làm việc.");
            }

            return Results.Ok(result.Value);
        })
        .WithName("GetAppointmentById")
        .RequireAuthorization(DefaultPermissions.Appointments.Read)
        .Produces<AppointmentDto>()
        .ProducesProblem(StatusCodes.Status404NotFound);

        // 3. List Appointments by Date Range (Đã cô lập theo ClinicId)
        group.MapGet("/", async (
            DateTimeOffset from,
            DateTimeOffset to,
            Guid? doctorId,
            [FromServices] ICurrentUser user,
            IQueryHandler<ListAppointmentsQuery, Result<IReadOnlyList<AppointmentSummaryDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            if (to <= from)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Khoảng thời gian không hợp lệ",
                    detail: "Thời gian kết thúc phải sau thời gian bắt đầu.");
            }

            var clinicId = user.ClinicId!.Value;
            var result = await handler.Handle(new ListAppointmentsQuery(clinicId, from, to, doctorId), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Error!.Message);
        })
        .WithName("ListAppointments")
        .RequireAuthorization(DefaultPermissions.Appointments.Read)
        .Produces<IReadOnlyList<AppointmentSummaryDto>>()
        .ProducesProblem(StatusCodes.Status400BadRequest);

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
        .RequireAuthorization(DefaultPermissions.Appointments.Update)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // 5. Confirm Appointment (Xác nhận lịch hẹn)
        group.MapPut("/{id:guid}/confirm", async (
            Guid id,
            ICommandHandler<ConfirmAppointmentCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ConfirmAppointmentCommand(id);
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
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể xác nhận lịch hẹn",
                        detail: error.Message)
                };
            }

            return Results.NoContent();
        })
        .WithName("ConfirmAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Update)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // 6. Cancel Appointment (Hủy lịch hẹn)
        group.MapPut("/{id:guid}/cancel", async (
            Guid id,
            CancelAppointmentRequest? request,
            ICommandHandler<CancelAppointmentCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CancelAppointmentCommand(id);
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
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể hủy lịch hẹn",
                        detail: error.Message)
                };
            }

            return Results.NoContent();
        })
        .WithName("CancelAppointment")
        .RequireAuthorization(DefaultPermissions.Appointments.Cancel)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }
}

public sealed record CreateAppointmentRequest(
    Guid PatientId,
    Guid DoctorId,
    Guid? ClinicId,
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

public sealed record CancelAppointmentRequest(string? Reason = null);
