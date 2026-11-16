using DentalManagement.Application.Common;
using DentalManagement.Application.Invoices.CancelInvoice;
using DentalManagement.Application.Invoices.CreateInvoice;
using DentalManagement.Application.Invoices.GetInvoice;
using DentalManagement.Application.Invoices.ListInvoices;
using DentalManagement.Application.Invoices.RecordPayment;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class InvoiceEndpoints
{
    public static IEndpointRouteBuilder MapInvoiceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/invoices").WithTags("Invoices");

        // POST / — tạo hóa đơn
        group.MapPost("/", async (
            CreateInvoiceRequest req,
            ICommandHandler<CreateInvoiceCommand, Result<Guid>> handler,
            CancellationToken ct) =>
        {
            var command = new CreateInvoiceCommand(
                req.PatientId, req.ClinicId, req.AppointmentId,
                req.Notes, req.DiscountAmount, req.DiscountPercent,
                req.Lines.Select(l => new InvoiceLineRequest(
                    l.Description, l.Quantity, l.UnitPrice, l.ServiceId, l.ToothNumber)).ToList());

            var result = await handler.Handle(command, ct);
            if (result.IsFailure)
                return MapError(result.Error!);

            return Results.Created($"/api/v1/invoices/{result.Value}", new { id = result.Value });
        })
        .WithName("CreateInvoice")
        .RequireAuthorization(DefaultPermissions.Invoices.Create);

        // GET /{id} — chi tiết hóa đơn
        group.MapGet("/{id:guid}", async (
            Guid id,
            IQueryHandler<GetInvoiceQuery, Result<InvoiceDto>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetInvoiceQuery(id), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: 404, title: "Không tìm thấy hóa đơn", detail: result.Error!.Message);
        })
        .WithName("GetInvoice")
        .RequireAuthorization(DefaultPermissions.Invoices.Read);

        // GET / — danh sách hóa đơn
        group.MapGet("/", async (
            Guid clinicId,
            Guid? patientId,
            DateTimeOffset? from,
            DateTimeOffset? to,
            IQueryHandler<ListInvoicesQuery, Result<IReadOnlyList<InvoiceSummaryDto>>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new ListInvoicesQuery(clinicId, from, to, patientId), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: 500, detail: result.Error!.Message);
        })
        .WithName("ListInvoices")
        .RequireAuthorization(DefaultPermissions.Invoices.Read);

        // POST /{id}/payments — ghi nhận thanh toán
        group.MapPost("/{id:guid}/payments", async (
            Guid id,
            RecordPaymentRequest req,
            ICommandHandler<RecordPaymentCommand, Result> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new RecordPaymentCommand(id, req.Amount, req.Method, req.Reference), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : MapError(result.Error!);
        })
        .WithName("RecordPayment")
        .RequireAuthorization(DefaultPermissions.Invoices.Pay);

        // PATCH /{id}/cancel — hủy hóa đơn
        group.MapPatch("/{id:guid}/cancel", async (
            Guid id,
            ICommandHandler<CancelInvoiceCommand, Result> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new CancelInvoiceCommand(id), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : MapError(result.Error!);
        })
        .WithName("CancelInvoice")
        .RequireAuthorization(DefaultPermissions.Invoices.Create);

        return endpoints;
    }

    private static IResult MapError(Error error) => error.Code switch
    {
        "invoice.not_found"   => Results.Problem(statusCode: 404, title: "Không tìm thấy", detail: error.Message),
        "invoice.paid"        => Results.Problem(statusCode: 422, title: "Hóa đơn đã thanh toán", detail: error.Message),
        "invoice.cancelled"   => Results.Problem(statusCode: 422, title: "Hóa đơn đã hủy", detail: error.Message),
        "invoice.overpayment" => Results.Problem(statusCode: 422, title: "Thanh toán vượt mức", detail: error.Message),
        _                     => Results.Problem(statusCode: 400, detail: error.Message)
    };
}

// ── Request records ────────────────────────────────────────────────────────
public sealed record CreateInvoiceRequest(
    Guid PatientId,
    Guid ClinicId,
    Guid? AppointmentId,
    string? Notes,
    decimal DiscountAmount,
    decimal DiscountPercent,
    IReadOnlyList<CreateInvoiceLineRequest> Lines);

public sealed record CreateInvoiceLineRequest(
    string Description,
    int Quantity,
    decimal UnitPrice,
    Guid? ServiceId,
    string? ToothNumber);

public sealed record RecordPaymentRequest(
    decimal Amount,
    string Method,
    string? Reference);
