using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Prescriptions.CancelPrescription;
using DentalManagement.Application.Prescriptions.CreatePrescription;
using DentalManagement.Application.Prescriptions.DispensePrescription;
using DentalManagement.Application.Prescriptions.ListPrescriptions;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Prescriptions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class PrescriptionEndpoints
{
    public static IEndpointRouteBuilder MapPrescriptionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/prescriptions")
            .WithTags("Prescriptions");

        // 1. Tạo đơn thuốc điện tử
        group.MapPost("/", async (
            CreatePrescriptionRequest request,
            [FromServices] ICurrentUser user,
            ICommandHandler<CreatePrescriptionCommand, Result<Guid>> handler,
            IValidator<CreatePrescriptionCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var items = request.Items
                .Select(i => new CreatePrescriptionItemInput(
                    i.InventoryItemId,
                    i.MedicationName,
                    i.Dosage,
                    i.Quantity,
                    i.Unit,
                    i.Instructions))
                .ToList();

            var command = new CreatePrescriptionCommand(
                user.ClinicId!.Value,
                request.Code,
                request.PatientId,
                request.PatientName,
                request.PatientCode,
                request.DoctorId,
                request.DoctorName,
                request.Diagnosis,
                request.MedicalNotes,
                request.IsDraft,
                items);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Không thể tạo đơn thuốc",
                    detail: result.Error!.Message);
            }

            return Results.Created($"/api/v1/prescriptions/{result.Value}", new
            {
                id = result.Value,
                message = "Tạo đơn thuốc thành công."
            });
        })
        .WithName("CreatePrescription")
        .RequireAuthorization(DefaultPermissions.Prescriptions.Create);

        // 2. Danh sách đơn thuốc theo phòng khám
        group.MapGet("/", async (
            Guid? patientId,
            string? status,
            [FromServices] ICurrentUser user,
            IQueryHandler<ListPrescriptionsQuery, Result<IReadOnlyList<PrescriptionDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            PrescriptionStatus? parsedStatus = null;
            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<PrescriptionStatus>(status, ignoreCase: true, out var parsed))
            {
                parsedStatus = parsed;
            }

            var result = await handler.Handle(new ListPrescriptionsQuery(user.ClinicId!.Value, patientId, parsedStatus), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Error!.Message);
        })
        .WithName("ListPrescriptions")
        .RequireAuthorization(DefaultPermissions.Prescriptions.Read);

        // 3. Cấp thuốc & Trừ kho tự động theo FEFO (ACID Transaction)
        group.MapPost("/{id:guid}/dispense", async (
            Guid id,
            [FromServices] ICurrentUser user,
            ICommandHandler<DispensePrescriptionCommand, Result<DispensePrescriptionResultDto>> handler,
            IValidator<DispensePrescriptionCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var command = new DispensePrescriptionCommand(id, user.ClinicId!.Value);
            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code == "prescription.not_found"
                    ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy đơn thuốc", detail: error.Message)
                    : Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Không thể cấp thuốc", detail: error.Message);
            }

            return Results.Ok(new
            {
                message = "Đã cấp thuốc và trừ kho tự động theo FEFO.",
                data = result.Value
            });
        })
        .WithName("DispensePrescription")
        .RequireAuthorization(DefaultPermissions.Prescriptions.Dispense);

        // 4. Hủy đơn thuốc
        group.MapPost("/{id:guid}/cancel", async (
            Guid id,
            [FromServices] ICurrentUser user,
            ICommandHandler<CancelPrescriptionCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new CancelPrescriptionCommand(id, user.ClinicId!.Value), cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code == "prescription.not_found"
                    ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy đơn thuốc", detail: error.Message)
                    : Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Không thể hủy đơn thuốc", detail: result.Error!.Message);
            }

            return Results.Ok(new { message = "Đã hủy đơn thuốc." });
        })
        .WithName("CancelPrescription")
        .RequireAuthorization(DefaultPermissions.Prescriptions.Create);

        return endpoints;
    }
}

public sealed record CreatePrescriptionItemRequest(
    Guid? InventoryItemId,
    string MedicationName,
    string Dosage,
    int Quantity,
    string Unit,
    string Instructions);

public sealed record CreatePrescriptionRequest(
    string? Code,
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    Guid? DoctorId,
    string DoctorName,
    string Diagnosis,
    string? MedicalNotes,
    bool IsDraft,
    IReadOnlyList<CreatePrescriptionItemRequest> Items);
