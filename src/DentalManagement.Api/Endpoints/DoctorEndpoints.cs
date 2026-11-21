using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Commands.CreateDoctor;
using DentalManagement.Application.Doctors.Commands.DeleteDoctor;
using DentalManagement.Application.Doctors.Commands.UpdateDoctor;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Application.Doctors.Queries.GetDoctorById;
using DentalManagement.Application.Doctors.Queries.GetDoctors;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class DoctorEndpoints
{
    public static IEndpointRouteBuilder MapDoctorEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/doctors")
            .WithTags("Doctors");

        // 1. Get List of Doctors
        group.MapGet("/", async (
            int? page,
            int? pageSize,
            Guid? clinicId,
            string? specialty,
            string? search,
            string? searchTerm,
            IQueryHandler<GetDoctorsQuery, Result<PagedResult<DoctorDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var effectiveSearch = search ?? searchTerm;
            var effectiveClinicId = clinicId == Guid.Empty ? null : clinicId;
            var query = new GetDoctorsQuery(
                page ?? 1,
                pageSize ?? 20,
                effectiveClinicId,
                specialty,
                effectiveSearch);

            var result = await handler.Handle(query, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Lỗi lấy danh sách", detail: result.Error!.Message);
        })
        .WithName("GetDoctors")
        .RequireAuthorization(DefaultPermissions.Doctors.Read);

        // 2. Get Doctor by ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IQueryHandler<GetDoctorByIdQuery, Result<DoctorDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetDoctorByIdQuery(id), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy bác sĩ", detail: result.Error!.Message);
        })
        .WithName("GetDoctorById")
        .RequireAuthorization(DefaultPermissions.Doctors.Read);

        // 3. Create Doctor Profile
        group.MapPost("/", async (
            CreateDoctorRequest request,
            ICommandHandler<CreateDoctorCommand, Result<DoctorDto>> handler,
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

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "doctor.user_not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy người dùng",
                        detail: error.Message),
                    "doctor.clinic_not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy phòng khám",
                        detail: error.Message),
                    "doctor.user_already_has_profile" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Hồ sơ bác sĩ đã tồn tại",
                        detail: error.Message),
                    "doctor.duplicate_license" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng số chứng chỉ hành nghề",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Tạo hồ sơ bác sĩ thất bại",
                        detail: error.Message)
                };
            }

            return Results.Created($"/api/v1/doctors/{result.Value!.Id}", result.Value);
        })
        .WithName("CreateDoctor")
        .RequireAuthorization(DefaultPermissions.Doctors.Create);

        // 4. Update Doctor Profile
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateDoctorRequest request,
            ICommandHandler<UpdateDoctorCommand, Result<DoctorDto>> handler,
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

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "doctor.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy bác sĩ",
                        detail: error.Message),
                    "doctor.clinic_not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy phòng khám",
                        detail: error.Message),
                    "doctor.duplicate_license" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng số chứng chỉ hành nghề",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Cập nhật hồ sơ bác sĩ thất bại",
                        detail: error.Message)
                };
            }

            return Results.Ok(result.Value);
        })
        .WithName("UpdateDoctor")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        // 5. Delete Doctor Profile
        group.MapDelete("/{id:guid}", async (
            Guid id,
            ICommandHandler<DeleteDoctorCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new DeleteDoctorCommand(id), cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "doctor.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy bác sĩ",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Xóa hồ sơ bác sĩ thất bại",
                        detail: error.Message)
                };
            }

            return Results.Ok(new { message = "Đã xóa hồ sơ bác sĩ thành công." });
        })
        .WithName("DeleteDoctor")
        .RequireAuthorization(DefaultPermissions.Doctors.Delete);

        // 6. Get Doctor Schedules
        group.MapGet("/{id:guid}/schedules", async (
            Guid id,
            IQueryHandler<DentalManagement.Application.Doctors.Queries.GetDoctorWorkSchedules.GetDoctorWorkSchedulesQuery, Result<IReadOnlyList<WorkScheduleDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new DentalManagement.Application.Doctors.Queries.GetDoctorWorkSchedules.GetDoctorWorkSchedulesQuery(id), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy bác sĩ", detail: result.Error!.Message);
        })
        .WithName("GetDoctorSchedules")
        .RequireAuthorization(DefaultPermissions.Doctors.Read);

        // 7. Assign Work Schedule to Doctor
        group.MapPost("/{id:guid}/schedules", async (
            Guid id,
            AssignScheduleRequest request,
            ICommandHandler<DentalManagement.Application.Doctors.Commands.AssignWorkSchedule.AssignWorkScheduleCommand, Result<WorkScheduleDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DentalManagement.Application.Doctors.Commands.AssignWorkSchedule.AssignWorkScheduleCommand(
                id,
                request.DayOfWeek,
                request.StartTime,
                request.EndTime,
                request.ClinicId,
                request.IsActive);

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "doctor.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy bác sĩ",
                        detail: error.Message),
                    "doctor.clinic_not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy phòng khám",
                        detail: error.Message),
                    "doctor.schedule_conflict" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng ca trực",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Gán ca trực thất bại",
                        detail: error.Message)
                };
            }

            return Results.Created($"/api/v1/doctors/{id}/schedules/{result.Value!.Id}", result.Value);
        })
        .WithName("AssignDoctorSchedule")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        // 8. Set All Schedules for Doctor
        group.MapPut("/{id:guid}/schedules", async (
            Guid id,
            SetSchedulesRequest request,
            ICommandHandler<DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules.SetDoctorWorkSchedulesCommand, Result<IReadOnlyList<WorkScheduleDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules.SetDoctorWorkSchedulesCommand(
                id,
                request.Schedules);

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "doctor.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy bác sĩ",
                        detail: error.Message),
                    "doctor.clinic_not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy phòng khám",
                        detail: error.Message),
                    "doctor.schedule_conflict" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng ca trực",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Cập nhật ca trực thất bại",
                        detail: error.Message)
                };
            }

            return Results.Ok(result.Value);
        })
        .WithName("SetDoctorSchedules")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        // 9. Remove Schedule from Doctor
        group.MapDelete("/{id:guid}/schedules/{scheduleId:guid}", async (
            Guid id,
            Guid scheduleId,
            ICommandHandler<DentalManagement.Application.Doctors.Commands.RemoveWorkSchedule.RemoveWorkScheduleCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DentalManagement.Application.Doctors.Commands.RemoveWorkSchedule.RemoveWorkScheduleCommand(id, scheduleId);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "doctor.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy bác sĩ",
                        detail: error.Message),
                    "doctor.schedule_not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy ca trực",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Xóa ca trực thất bại",
                        detail: error.Message)
                };
            }

            return Results.Ok(new { message = "Đã xóa ca trực thành công." });
        })
        .WithName("RemoveDoctorSchedule")
        .RequireAuthorization(DefaultPermissions.Doctors.Update);

        return endpoints;
    }
}

public sealed record CreateDoctorRequest(
    Guid UserId,
    string MedicalLicenseNumber,
    Guid? ClinicId = null,
    int YearsOfExperience = 0,
    string? Specialty = null,
    string? Biography = null,
    IEnumerable<WorkScheduleDto>? WorkSchedules = null);

public sealed record UpdateDoctorRequest(
    string MedicalLicenseNumber,
    Guid? ClinicId = null,
    int YearsOfExperience = 0,
    string? Specialty = null,
    string? Biography = null,
    IEnumerable<WorkScheduleDto>? WorkSchedules = null);

public sealed record AssignScheduleRequest(
    int DayOfWeek,
    string StartTime,
    string EndTime,
    Guid? ClinicId = null,
    bool IsActive = true);

public sealed record SetSchedulesRequest(
    IEnumerable<DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules.WorkScheduleInputDto> Schedules);
