using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Patients;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
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
        group.AddEndpointFilter(async (context, next) =>
        {
            var user = context.HttpContext.RequestServices
                .GetRequiredService<ICurrentUser>();

            if (user.ClinicId is not { } clinicId || clinicId == Guid.Empty)
            {
                return Results.Problem(
                    statusCode: 403,
                    title: "Chưa chọn phòng khám",
                    detail: "Hãy đăng nhập hoặc chuyển sang phòng khám có quyền truy cập.");
            }

            return await next(context);
        });

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