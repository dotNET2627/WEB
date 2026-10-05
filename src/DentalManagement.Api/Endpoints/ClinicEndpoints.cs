using DentalManagement.Application.Clinics.Commands.CreateClinic;
using DentalManagement.Application.Clinics.Commands.DeleteClinic;
using DentalManagement.Application.Clinics.Commands.UpdateClinic;
using DentalManagement.Application.Clinics.Dtos;
using DentalManagement.Application.Clinics.Queries.GetClinicById;
using DentalManagement.Application.Clinics.Queries.GetClinics;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class ClinicEndpoints
{
    public static IEndpointRouteBuilder MapClinicEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/clinics")
            .WithTags("Clinics");

        // 1. Get List of Clinics
        group.MapGet("/", async (
            int? page,
            int? pageSize,
            string? search,
            bool? activeOnly,
            IQueryHandler<GetClinicsQuery, Result<PagedResult<ClinicDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetClinicsQuery(
                page ?? 1,
                pageSize ?? 20,
                search,
                activeOnly);

            var result = await handler.Handle(query, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Lỗi lấy danh sách", detail: result.Error!.Message);
        })
        .WithName("GetClinics")
        .RequireAuthorization(DefaultPermissions.Clinics.Read);

        // 2. Get Clinic by ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IQueryHandler<GetClinicByIdQuery, Result<ClinicDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetClinicByIdQuery(id), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy phòng khám", detail: result.Error!.Message);
        })
        .WithName("GetClinicById")
        .RequireAuthorization(DefaultPermissions.Clinics.Read);

        // 3. Create Clinic
        group.MapPost("/", async (
            CreateClinicRequest request,
            ICommandHandler<CreateClinicCommand, Result<ClinicDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateClinicCommand(
                request.Name,
                request.Address,
                request.PhoneNumber,
                request.Email,
                request.Description,
                request.OpeningHours,
                request.Logo);

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "clinic.duplicate_name" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng tên phòng khám",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Tạo phòng khám thất bại",
                        detail: error.Message)
                };
            }

            return Results.Created($"/api/v1/clinics/{result.Value!.Id}", result.Value);
        })
        .WithName("CreateClinic")
        .RequireAuthorization(DefaultPermissions.Clinics.Create);

        // 4. Update Clinic
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateClinicRequest request,
            ICommandHandler<UpdateClinicCommand, Result<ClinicDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateClinicCommand(
                id,
                request.Name,
                request.Address,
                request.PhoneNumber,
                request.Email,
                request.Description,
                request.OpeningHours,
                request.Logo,
                request.IsActive);

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "clinic.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy phòng khám",
                        detail: error.Message),
                    "clinic.duplicate_name" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng tên phòng khám",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Cập nhật phòng khám thất bại",
                        detail: error.Message)
                };
            }

            return Results.Ok(result.Value);
        })
        .WithName("UpdateClinic")
        .RequireAuthorization(DefaultPermissions.Clinics.Update);

        // 5. Delete Clinic
        group.MapDelete("/{id:guid}", async (
            Guid id,
            ICommandHandler<DeleteClinicCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new DeleteClinicCommand(id), cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "clinic.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy phòng khám",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Xóa phòng khám thất bại",
                        detail: error.Message)
                };
            }

            return Results.Ok(new { message = "Đã xóa phòng khám thành công." });
        })
        .WithName("DeleteClinic")
        .RequireAuthorization(DefaultPermissions.Clinics.Delete);

        return endpoints;
    }
}

public sealed record CreateClinicRequest(
    string Name,
    string Address,
    string? PhoneNumber = null,
    string? Email = null,
    string? Description = null,
    IReadOnlyDictionary<string, string>? OpeningHours = null,
    string? Logo = null);

public sealed record UpdateClinicRequest(
    string Name,
    string Address,
    string? PhoneNumber = null,
    string? Email = null,
    string? Description = null,
    IReadOnlyDictionary<string, string>? OpeningHours = null,
    string? Logo = null,
    bool IsActive = true);
