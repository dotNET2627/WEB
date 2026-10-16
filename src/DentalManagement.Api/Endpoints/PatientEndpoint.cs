using DentalManagement.Api.Extensions;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Patients;
using DentalManagement.Application.Patients.Odontogram;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class PatientEndpoints
{
    public static IEndpointRouteBuilder MapPatientEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/v1/patients")
            .WithTags("Patients")
            .RequireAuthorization();

        // Lấy phòng khám từ tài khoản đang đăng nhập.
        group.RequireClinic();

        // Danh sách, phân trang và tìm kiếm.
        group.MapGet("", async (
            int? page,
            int? pageSize,
            string? search,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            if (page is < 1 ||
                pageSize is < 1 or > 100 ||
                search?.Length > 200 ||
                ((long)(page ?? 1) - 1) * (pageSize ?? 20) > int.MaxValue)
            {
                return Results.Problem(
                    statusCode: 400,
                    title: "Tham số không hợp lệ",
                    detail: "page >= 1; pageSize từ 1 đến 100; search tối đa 200 ký tự.");
            }

            var result = await service.GetPageAsync(
                new GetPatientsQuery(
                    user.ClinicId!.Value,
                    page ?? 1,
                    pageSize ?? 20,
                    search),
                ct);

            return Results.Ok(result);
        })
        .WithName("GetPatients")
        .RequireAuthorization(DefaultPermissions.Patients.Read)
        .Produces<PagedResult<PatientDto>>()
        .ProducesProblem(400);

        // Chi tiết bệnh nhân.
        group.MapGet("/{id:guid}", async (
            Guid id,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            var result = await service.GetByIdAsync(
                new GetPatientQuery(user.ClinicId!.Value, id), ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetPatient")
        .RequireAuthorization(DefaultPermissions.Patients.Read)
        .Produces<PatientDto>()
        .ProducesProblem(404);

        // Thêm bệnh nhân.
        group.MapPost("", async (
            PatientRequest request,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            var result = await service.CreateAsync(
                new CreatePatientCommand(
                    user.ClinicId!.Value,
                    request.FullName,
                    request.PatientCode,
                    request.PhoneNumber,
                    request.DateOfBirth),
                ct);

            return result.IsSuccess
                ? Results.Created(
                    $"/api/v1/patients/{result.Value}",
                    new PatientCreatedResponse(result.Value))
                : ToProblem(result.Error!);
        })
        .WithName("CreatePatient")
        .RequireAuthorization(DefaultPermissions.Patients.Create)
        .Produces<PatientCreatedResponse>(201)
        .ProducesProblem(400)
        .ProducesProblem(409);

        // Sửa bệnh nhân.
        group.MapPut("/{id:guid}", async (
            Guid id,
            PatientRequest request,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            var result = await service.UpdateAsync(
                new UpdatePatientCommand(
                    user.ClinicId!.Value,
                    id,
                    request.FullName,
                    request.PatientCode,
                    request.PhoneNumber,
                    request.DateOfBirth),
                ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("UpdatePatient")
        .RequireAuthorization(DefaultPermissions.Patients.Update)
        .Produces<PatientDto>()
        .ProducesProblem(400)
        .ProducesProblem(404)
        .ProducesProblem(409);

        // Xóa mềm bệnh nhân.
        group.MapDelete("/{id:guid}", async (
            Guid id,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            var result = await service.DeleteAsync(
                new DeletePatientCommand(user.ClinicId!.Value, id), ct);

            return result.IsSuccess
                ? Results.NoContent()
                : ToProblem(result.Error!);
        })
        .WithName("DeletePatient")
        .RequireAuthorization(DefaultPermissions.Patients.Delete)
        .Produces(204)
        .ProducesProblem(404);

        // ---- Tiền sử bệnh lý (medical history) ----

        // Danh sách tiền sử bệnh lý.
        group.MapGet("/{id:guid}/medical-history", async (
            Guid id,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            var result = await service.GetMedicalHistoryAsync(
                new GetMedicalHistoryQuery(user.ClinicId!.Value, id), ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetPatientMedicalHistory")
        .RequireAuthorization(DefaultPermissions.Patients.Read)
        .Produces<IReadOnlyList<MedicalHistoryItemDto>>()
        .ProducesProblem(404);

        // Thêm một mục tiền sử bệnh lý.
        group.MapPost("/{id:guid}/medical-history", async (
            Guid id,
            MedicalHistoryRequest request,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            var result = await service.AddMedicalHistoryAsync(
                new AddMedicalHistoryCommand(
                    user.ClinicId!.Value,
                    id,
                    request.Type,
                    request.Name,
                    request.Severity,
                    request.Notes),
                ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/patients/{id}/medical-history", result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("AddPatientMedicalHistory")
        .RequireAuthorization(DefaultPermissions.Patients.Update)
        .Produces<MedicalHistoryItemDto>(201)
        .ProducesProblem(400)
        .ProducesProblem(404);

        // Xóa một mục tiền sử bệnh lý theo chỉ số.
        group.MapDelete("/{id:guid}/medical-history/{index:int}", async (
            Guid id,
            int index,
            [FromServices] ICurrentUser user,
            [FromServices] PatientService service,
            CancellationToken ct) =>
        {
            var result = await service.RemoveMedicalHistoryAsync(
                new RemoveMedicalHistoryCommand(user.ClinicId!.Value, id, index), ct);

            return result.IsSuccess
                ? Results.NoContent()
                : ToProblem(result.Error!);
        })
        .WithName("DeletePatientMedicalHistory")
        .RequireAuthorization(DefaultPermissions.Patients.Update)
        .Produces(204)
        .ProducesProblem(400)
        .ProducesProblem(404);

        // ---- Sơ đồ răng (odontogram) ----

        // Toàn bộ sơ đồ răng của bệnh nhân.
        group.MapGet("/{id:guid}/odontogram", async (
            Guid id,
            [FromServices] ICurrentUser user,
            [FromServices] IQueryHandler<GetOdontogramQuery, Result<IReadOnlyList<ToothConditionDto>>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(
                new GetOdontogramQuery(user.ClinicId!.Value, id), ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetPatientOdontogram")
        .RequireAuthorization(DefaultPermissions.Patients.Read)
        .Produces<IReadOnlyList<ToothConditionDto>>()
        .ProducesProblem(404);

        // Cập nhật tình trạng một răng (healthy = xóa ghi chú của răng).
        group.MapPut("/{id:guid}/odontogram/{toothNumber:int}", async (
            Guid id,
            int toothNumber,
            ToothConditionRequest request,
            [FromServices] ICurrentUser user,
            [FromServices] ICommandHandler<UpdateToothConditionCommand, Result<ToothConditionDto>> handler,
            [FromServices] IValidator<UpdateToothConditionCommand> validator,
            CancellationToken ct) =>
        {
            var command = new UpdateToothConditionCommand(
                user.ClinicId!.Value,
                id,
                toothNumber,
                request.Condition,
                request.Surfaces,
                request.Notes,
                user.UserId?.ToString());

            var validation = await validator.ValidateAsync(command, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            var result = await handler.Handle(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("UpdatePatientToothCondition")
        .RequireAuthorization(DefaultPermissions.Patients.Update)
        .Produces<ToothConditionDto>()
        .ProducesProblem(400)
        .ProducesProblem(404);

        return endpoints;
    }

    private static IResult ToProblem(Error error)
    {
        return Results.Problem(
            statusCode: error.Code switch
            {
                "patient.not_found" => 404,
                "patient.duplicate_code" => 409,
                _ => 400
            },
            title: "Không thể xử lý bệnh nhân",
            detail: error.Message,
            extensions: new Dictionary<string, object?>
            {
                ["code"] = error.Code
            });
    }
}

public sealed record PatientRequest(
    string FullName,
    string? PatientCode = null,
    string? PhoneNumber = null,
    DateOnly? DateOfBirth = null);

public sealed record PatientCreatedResponse(Guid Id);

/// <summary>Body for POST /patients/{id}/medical-history (extra client fields such as id/createdAt are ignored).</summary>
public sealed record MedicalHistoryRequest(
    string Type,
    string Name,
    string? Severity = null,
    string? Notes = null);

/// <summary>Body for PUT /patients/{id}/odontogram/{toothNumber}.</summary>
public sealed record ToothConditionRequest(
    string Condition,
    IReadOnlyList<string>? Surfaces = null,
    string? Notes = null);