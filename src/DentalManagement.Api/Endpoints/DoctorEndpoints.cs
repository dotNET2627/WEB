using DentalManagement.Application.Doctors;
using DentalManagement.Application.DoctorsDTO;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class DoctorEndpoints
{
    public static IEndpointRouteBuilder MapDoctorEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/doctors")
            .WithTags("Doctors");

        // 1. Danh sách bác sĩ.
        group.MapGet("/", async (
            int? page,
            int? pageSize,
            Guid? clinicId,
            string? specialty,
            string? search,
            string? searchTerm,
            [FromServices] DoctorService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.GetDoctorsAsync(
                page ?? 1,
                pageSize ?? 20,
                clinicId == Guid.Empty ? null : clinicId,
                specialty,
                search ?? searchTerm,
                cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetDoctors")
        .RequireAuthorization(DefaultPermissions.Doctors.Read);

        // 2. Chi tiết bác sĩ.
        group.MapGet("/{id:guid}", async (
            Guid id,
            [FromServices] DoctorService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.GetByIdAsync(
                id,
                cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetDoctorById")
        .RequireAuthorization(DefaultPermissions.Doctors.Read);

        // 3. Tạo hồ sơ bác sĩ.
        group.MapPost("/", async (
            CreateDoctorRequest request,
            [FromServices] DoctorService service,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateDoctorCommand(
                request.UserId,
                request.MedicalLicenseNumber,
                request.ClinicId,
                request.YearsOfExperience,
                request.Specialty,
                request.Biography,
                request.WorkSchedules);

            var result = await service.CreateAsync(
                command,
                cancellationToken);

            return result.IsSuccess
                ? Results.Created(
                    $"/api/v1/doctors/{result.Value!.Id}",
                    result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("CreateDoctor")
        .RequireAuthorization(DefaultPermissions.Doctors.Create);

        // 4. Cập nhật hồ sơ bác sĩ.
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateDoctorRequest request,
            [FromServices] DoctorService service,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateDoctorCommand(
                id,
                request.MedicalLicenseNumber,
                request.ClinicId,
                request.YearsOfExperience,
                request.Specialty,
                request.Biography,
                request.WorkSchedules);

            var result = await service.UpdateAsync(
                command,
                cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("UpdateDoctor")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        // 5. Xóa hồ sơ bác sĩ.
        group.MapDelete("/{id:guid}", async (
            Guid id,
            [FromServices] DoctorService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.DeleteAsync(
                id,
                cancellationToken);

            return result.IsSuccess
                ? Results.Ok(new
                {
                    message = "Đã xóa hồ sơ bác sĩ thành công."
                })
                : ToProblem(result.Error!);
        })
        .WithName("DeleteDoctor")
        .RequireAuthorization(DefaultPermissions.Doctors.Delete);

        // 6. Lấy lịch làm việc.
        group.MapGet("/{id:guid}/schedules", async (
            Guid id,
            [FromServices] DoctorService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.GetWorkSchedulesAsync(
                id,
                cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : ToProblem(result.Error!);
        })
        .WithName("GetDoctorSchedules")
        .RequireAuthorization(DefaultPermissions.Doctors.Read);

        // 7. Thêm một ca trực.
        group.MapPost("/{id:guid}/schedules", async (
            Guid id,
            AssignScheduleRequest request,
            [FromServices] SchedulesService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var dto = new AssignWorkScheduleDto(
                    request.DayOfWeek,
                    request.StartTime,
                    request.EndTime,
                    request.ClinicId,
                    request.IsActive);

                var schedule = await service.AddAsync(
                    id,
                    dto,
                    cancellationToken);

                return Results.Created(
                    $"/api/v1/doctors/{id}/schedules/{schedule.Id}",
                    schedule);
            }
            catch (SchedulesException ex)
            {
                return ToProblem(ex.Code, ex.Message);
            }
        })
        .WithName("AssignDoctorSchedule")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        // 8. Thay toàn bộ lịch làm việc.
        group.MapPut("/{id:guid}/schedules", async (
            Guid id,
            SetSchedulesRequest request,
            [FromServices] SchedulesService service,
            CancellationToken cancellationToken) =>
        {
            if (request.Schedules is null)
            {
                return ToProblem(
                    "schedule.invalid_input",
                    "Danh sách ca trực không được null.");
            }

            try
            {
                var dto = new SetDoctorWorkSchedulesDto(
                    request.Schedules);

                var schedules = await service.SetAsync(
                    id,
                    dto,
                    cancellationToken);

                return Results.Ok(schedules);
            }
            catch (SchedulesException ex)
            {
                return ToProblem(ex.Code, ex.Message);
            }
        })
        .WithName("SetDoctorSchedules")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        // 9. Xóa một ca trực.
        group.MapDelete("/{id:guid}/schedules/{scheduleId:guid}", async (
            Guid id,
            Guid scheduleId,
            [FromServices] SchedulesService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await service.RemoveAsync(
                    id,
                    scheduleId,
                    cancellationToken);

                return Results.Ok(new
                {
                    message = "Đã xóa ca trực thành công."
                });
            }
            catch (SchedulesException ex)
            {
                return ToProblem(ex.Code, ex.Message);
            }
        })
        .WithName("RemoveDoctorSchedule")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        return endpoints;
    }

    private static IResult ToProblem(Error error)
    {
        return ToProblem(error.Code, error.Message);
    }

    private static IResult ToProblem(string code, string message)
    {
        var statusCode = code switch
        {
            "doctor.not_found" or
            "doctor.user_not_found" or
            "doctor.clinic_not_found" or
            "doctor.schedule_not_found"
                => StatusCodes.Status404NotFound,

            "doctor.user_already_has_profile" or
            "doctor.duplicate_license" or
            "doctor.schedule_conflict"
                => StatusCodes.Status409Conflict,

            _ => StatusCodes.Status400BadRequest
        };

        return Results.Problem(
            statusCode: statusCode,
            title: "Không thể xử lý yêu cầu bác sĩ",
            detail: message,
            extensions: new Dictionary<string, object?>
            {
                ["code"] = code
            });
    }
}

public sealed record CreateDoctorRequest(
    Guid UserId,
    string MedicalLicenseNumber,
    Guid? ClinicId = null,
    int YearsOfExperience = 0,
    string? Specialty = null,
    string? Biography = null,
    IReadOnlyList<WorkScheduleInputDto>? WorkSchedules = null);

public sealed record UpdateDoctorRequest(
    string MedicalLicenseNumber,
    Guid? ClinicId = null,
    int YearsOfExperience = 0,
    string? Specialty = null,
    string? Biography = null,
    IReadOnlyList<WorkScheduleInputDto>? WorkSchedules = null);

public sealed record AssignScheduleRequest(
    int DayOfWeek,
    string StartTime,
    string EndTime,
    Guid? ClinicId = null,
    bool IsActive = true);

public sealed record SetSchedulesRequest(
    IReadOnlyList<WorkScheduleInputDto>? Schedules);