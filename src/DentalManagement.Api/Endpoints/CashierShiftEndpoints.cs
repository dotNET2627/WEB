using DentalManagement.Api.Extensions;
using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using Microsoft.AspNetCore.Mvc;
using DentalManagement.Application.Billing.Shifts;
using DentalManagement.Application.Billing.Shifts.CloseShift;
using DentalManagement.Application.Billing.Shifts.GetCurrentShift;
using DentalManagement.Application.Billing.Shifts.ListShifts;
using DentalManagement.Application.Billing.Shifts.OpenShift;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class CashierShiftEndpoints
{
    public static IEndpointRouteBuilder MapCashierShiftEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/cashier-shifts").WithTags("CashierShifts");
        group.RequireClinic();

        // POST /open — Mở ca làm việc thu ngân
        group.MapPost("/open", async (
            OpenCashierShiftRequest req,
            [FromServices] ICurrentUser user,
            [FromServices] IUserRepository users,
            ICommandHandler<OpenCashierShiftCommand, Result<Guid>> handler,
            CancellationToken ct) =>
        {
            if (user.UserId is not { } cashierId || await users.GetByIdAsync(cashierId, ct) is not { } cashier)
                return Results.Forbid();

            var command = new OpenCashierShiftCommand(
                user.ClinicId!.Value,
                cashierId,
                cashier.FullName,
                req.OpeningCash,
                req.Notes);

            var result = await handler.Handle(command, ct);
            if (result.IsFailure)
                return MapError(result.Error!);

            return Results.Created($"/api/v1/cashier-shifts/{result.Value}", new { id = result.Value });
        })
        .WithName("OpenCashierShift")
        .RequireAuthorization(DefaultPermissions.CashierShifts.Manage);

        // GET /current — Lấy ca làm việc hiện tại đang mở kèm số liệu đối soát thời gian thực
        group.MapGet("/current", async (
            Guid? cashierId,
            [FromServices] ICurrentUser user,
            IQueryHandler<GetCurrentCashierShiftQuery, Result<CashierShiftDto?>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetCurrentCashierShiftQuery(user.ClinicId!.Value, cashierId), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: 500, detail: result.Error!.Message);
        })
        .WithName("GetCurrentCashierShift")
        .RequireAuthorization(DefaultPermissions.CashierShifts.Read);

        // POST /{id}/close — Chốt ca làm việc thu ngân
        group.MapPost("/{id:guid}/close", async (
            Guid id,
            CloseCashierShiftRequest req,
            [FromServices] ICurrentUser user,
            ICommandHandler<CloseCashierShiftCommand, Result> handler,
            CancellationToken ct) =>
        {
            var command = new CloseCashierShiftCommand(
                user.ClinicId!.Value,
                id,
                req.ActualCash,
                req.ActualTransfer,
                req.ActualCard,
                req.Notes);

            var result = await handler.Handle(command, ct);
            return result.IsSuccess
                ? Results.NoContent()
                : MapError(result.Error!);
        })
        .WithName("CloseCashierShift")
        .RequireAuthorization(DefaultPermissions.CashierShifts.Manage);

        // GET / — Lịch sử danh sách các ca làm việc
        group.MapGet("/", async (
            DateTimeOffset? from,
            DateTimeOffset? to,
            Guid? cashierId,
            [FromServices] ICurrentUser user,
            IQueryHandler<ListCashierShiftsQuery, Result<IReadOnlyList<CashierShiftSummaryDto>>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new ListCashierShiftsQuery(user.ClinicId!.Value, from, to, cashierId), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: 500, detail: result.Error!.Message);
        })
        .WithName("ListCashierShifts")
        .RequireAuthorization(DefaultPermissions.CashierShifts.Read);

        return endpoints;
    }

    private static IResult MapError(Error error) => error.Code switch
    {
        "shift.not_found" => Results.Problem(statusCode: 404, title: "Không tìm thấy", detail: error.Message),
        "shift.already_open" => Results.Problem(statusCode: 409, title: "Ca đang mở", detail: error.Message),
        "shift.already_closed" => Results.Problem(statusCode: 422, title: "Ca đã đóng", detail: error.Message),
        _ => Results.Problem(statusCode: 400, detail: error.Message)
    };
}

// ── Request records ────────────────────────────────────────────────────────
public sealed record OpenCashierShiftRequest(
    decimal OpeningCash,
    string? Notes = null);

public sealed record CloseCashierShiftRequest(
    decimal ActualCash,
    decimal ActualTransfer,
    decimal ActualCard,
    string? Notes = null);
