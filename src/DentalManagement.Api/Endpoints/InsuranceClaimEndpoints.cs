using DentalManagement.Api.Extensions;
using DentalManagement.Application.Abstractions.Services;
using Microsoft.AspNetCore.Mvc;
using DentalManagement.Application.Common;
using DentalManagement.Application.Insurance.CreateClaim;
using DentalManagement.Application.Insurance.GetClaim;
using DentalManagement.Application.Insurance.ListClaims;
using DentalManagement.Application.Insurance.UpdateClaimStatus;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Insurance;

namespace DentalManagement.Api.Endpoints;

public static class InsuranceClaimEndpoints
{
    public static IEndpointRouteBuilder MapInsuranceClaimEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/insurance-claims").WithTags("InsuranceClaims");
        group.RequireClinic();

        // POST / — tạo hồ sơ yêu cầu bồi thường bảo hiểm
        group.MapPost("/", async (
            CreateInsuranceClaimRequest req,
            [FromServices] ICurrentUser user,
            ICommandHandler<CreateInsuranceClaimCommand, Result<Guid>> handler,
            CancellationToken ct) =>
        {
            var command = new CreateInsuranceClaimCommand(
                req.PatientId,
                user.ClinicId!.Value,
                req.InsuranceType,
                req.ProviderName,
                req.CardNumber,
                req.PolicyNumber,
                req.CoverageRate,
                req.InvoiceId,
                req.AppointmentId,
                req.Diagnosis,
                req.DoctorName,
                req.Notes,
                req.Items.Select(i => new CreateClaimItemRequest(
                    i.Description, i.Quantity, i.UnitPrice, i.ToothNumber, i.ServiceId)).ToList());

            var result = await handler.Handle(command, ct);
            if (result.IsFailure)
                return MapError(result.Error!);

            return Results.Created($"/api/v1/insurance-claims/{result.Value}", new { id = result.Value });
        })
        .WithName("CreateInsuranceClaim")
        .RequireAuthorization(DefaultPermissions.Insurance.Create);

        // GET /{id} — chi tiết hồ sơ
        group.MapGet("/{id:guid}", async (
            Guid id,
            [FromServices] ICurrentUser user,
            IQueryHandler<GetInsuranceClaimQuery, Result<InsuranceClaimDto>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetInsuranceClaimQuery(user.ClinicId!.Value, id), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: 404, title: "Không tìm thấy hồ sơ bảo hiểm", detail: result.Error!.Message);
        })
        .WithName("GetInsuranceClaim")
        .RequireAuthorization(DefaultPermissions.Insurance.Read);

        // GET / — danh sách hồ sơ
        group.MapGet("/", async (
            Guid? patientId,
            InsuranceClaimStatus? status,
            InsuranceType? insuranceType,
            DateTimeOffset? from,
            DateTimeOffset? to,
            [FromServices] ICurrentUser user,
            IQueryHandler<ListInsuranceClaimsQuery, Result<IReadOnlyList<InsuranceClaimSummaryDto>>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new ListInsuranceClaimsQuery(
                user.ClinicId!.Value, from, to, status, insuranceType, patientId), ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: 500, detail: result.Error!.Message);
        })
        .WithName("ListInsuranceClaims")
        .RequireAuthorization(DefaultPermissions.Insurance.Read);

        // PATCH /{id}/status — cập nhật trạng thái hồ sơ (Duyệt / Từ chối / Đã thanh toán)
        group.MapPatch("/{id:guid}/status", async (
            Guid id,
            UpdateClaimStatusRequest req,
            [FromServices] ICurrentUser user,
            ICommandHandler<UpdateInsuranceClaimStatusCommand, Result> handler,
            CancellationToken ct) =>
        {
            var command = new UpdateInsuranceClaimStatusCommand(
                user.ClinicId!.Value,
                id,
                req.Action,
                req.ApprovedAmount,
                req.Notes,
                req.Reason,
                req.Reference);

            var result = await handler.Handle(command, ct);
            return result.IsSuccess
                ? Results.NoContent()
                : MapError(result.Error!);
        })
        .WithName("UpdateInsuranceClaimStatus")
        .RequireAuthorization(DefaultPermissions.Insurance.Update);

        return endpoints;
    }

    private static IResult MapError(Error error) => error.Code switch
    {
        "insurance_claim.not_found" => Results.Problem(statusCode: 404, title: "Không tìm thấy", detail: error.Message),
        "patient.not_found" or "invoice.not_found" or "appointment.not_found" => Results.Problem(statusCode: 404, detail: error.Message),
        "insurance_claim.invalid_state" => Results.Problem(statusCode: 422, title: "Trạng thái không hợp lệ", detail: error.Message),
        "insurance_claim.amount_exceeded" => Results.Problem(statusCode: 422, title: "Số tiền vượt mức", detail: error.Message),
        _ => Results.Problem(statusCode: 400, detail: error.Message)
    };
}

// ── Request records ────────────────────────────────────────────────────────
public sealed record CreateInsuranceClaimRequest(
    Guid PatientId,
    InsuranceType InsuranceType,
    string ProviderName,
    string CardNumber,
    string? PolicyNumber,
    decimal? CoverageRate,
    Guid? InvoiceId,
    Guid? AppointmentId,
    string? Diagnosis,
    string? DoctorName,
    string? Notes,
    IReadOnlyList<CreateClaimItemDto> Items);

public sealed record CreateClaimItemDto(
    string Description,
    int Quantity,
    decimal UnitPrice,
    string? ToothNumber = null,
    Guid? ServiceId = null);

public sealed record UpdateClaimStatusRequest(
    ClaimStatusAction Action,
    decimal? ApprovedAmount = null,
    string? Notes = null,
    string? Reason = null,
    string? Reference = null);
