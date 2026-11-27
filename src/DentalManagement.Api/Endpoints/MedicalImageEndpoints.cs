using DentalManagement.Api.Extensions;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.MedicalImages;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class MedicalImageEndpoints
{
    public static IEndpointRouteBuilder MapMedicalImageEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/v1/patients")
            .WithTags("Medical Images")
            .RequireAuthorization();

        // Lấy phòng khám từ tài khoản đang đăng nhập.
        group.RequireClinic();

        // Danh sách ảnh y tế của một bệnh nhân.
        group.MapGet("/{patientId:guid}/images", async (
            Guid patientId,
            [FromServices] ICurrentUser user,
            [FromServices] MedicalImageService service,
            CancellationToken ct) =>
        {
            var result = await service.ListAsync(user.ClinicId!.Value, patientId, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetMedicalImages")
        .RequireAuthorization(DefaultPermissions.Patients.Read)
        .Produces<IReadOnlyList<MedicalImageDto>>()
        .ProducesProblem(400)
        .ProducesProblem(404);

        group.MapGet("/{patientId:guid}/images/{imageId:guid}/content", async (
            Guid patientId,
            Guid imageId,
            HttpContext httpContext,
            ICurrentUser user,
            MedicalImageService service,
            CancellationToken ct) =>
        {
            var result = await service.OpenAsync(user.ClinicId!.Value, patientId, imageId, ct);
            if (result.IsFailure)
                return ToProblem(result.Error!);

            httpContext.Response.Headers.CacheControl = "no-store";
            httpContext.Response.Headers.XContentTypeOptions = "nosniff";
            var file = result.Value!;
            return Results.File(file.Content, file.ContentType);
        })
        .WithName("GetMedicalImageContent")
        .RequireAuthorization(DefaultPermissions.Patients.Read);

        // Tải lên ảnh y tế (multipart/form-data, tối đa 15 MB, jpg/png/dicom).
        group.MapPost("/{patientId:guid}/images", async (
            Guid patientId,
            [FromForm] IFormFile? file,
            [FromForm] string? type,
            [FromForm] string? title,
            [FromForm] int? toothNumber,
            [FromForm] string? notes,
            [FromForm] DateTimeOffset? capturedAt,
            [FromForm] string? comparisonRole,
            [FromServices] ICurrentUser user,
            [FromServices] MedicalImageService service,
            CancellationToken ct) =>
        {
            if (file is null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["file"] = ["Tệp ảnh là bắt buộc (jpg/png/dicom, tối đa 15 MB)."]
                });
            }

            var command = new UploadMedicalImageCommand(
                user.ClinicId!.Value,
                patientId,
                type ?? string.Empty,
                title ?? string.Empty,
                file.FileName,
                file.ContentType ?? string.Empty,
                file.Length,
                toothNumber,
                notes,
                capturedAt,
                user.UserId?.ToString(),
                comparisonRole);

            await using var content = file.OpenReadStream();
            var result = await service.UploadAsync(command, content, ct);

            return result.IsSuccess
                ? Results.Created(
                    $"/api/v1/patients/{patientId}/images/{result.Value!.Id}",
                    result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("UploadMedicalImage")
        .RequireAuthorization(DefaultPermissions.Patients.Update)
        .DisableAntiforgery()
        .Produces<MedicalImageDto>(201)
        .ProducesProblem(400)
        .ProducesProblem(404);

        // Xóa ảnh y tế (xóa cả tệp vật lý).
        group.MapDelete("/{patientId:guid}/images/{imageId:guid}", async (
            Guid patientId,
            Guid imageId,
            [FromServices] ICurrentUser user,
            [FromServices] MedicalImageService service,
            CancellationToken ct) =>
        {
            var result = await service.DeleteAsync(user.ClinicId!.Value, patientId, imageId, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : ToProblem(result.Error!);
        })
        .WithName("DeleteMedicalImage")
        .RequireAuthorization(DefaultPermissions.Patients.Update)
        .Produces(204)
        .ProducesProblem(404);

        return endpoints;
    }

    private static IResult ToProblem(Error error)
    {
        return Results.Problem(
            statusCode: error.Code switch
            {
                "patient.not_found" or "image.not_found" => 404,
                _ => 400
            },
            title: "Không thể xử lý ảnh y tế",
            detail: error.Message,
            extensions: new Dictionary<string, object?>
            {
                ["code"] = error.Code
            });
    }
}
