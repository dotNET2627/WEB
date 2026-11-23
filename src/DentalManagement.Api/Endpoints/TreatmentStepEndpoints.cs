using DentalManagement.Api.Contracts;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Application.Treatments.ChangeTreatmentStepStatus;
using DentalManagement.Application.Treatments.Common;
using DentalManagement.Application.Treatments.CreateTreatmentStep;
using DentalManagement.Application.Treatments.DeleteTreatmentStep;
using DentalManagement.Application.Treatments.GetTreatmentStepsByPlan;
using DentalManagement.Application.Treatments.UpdateTreatmentStep;
using DentalManagement.Domain.Common;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class TreatmentStepEndpoints
{
    public static IEndpointRouteBuilder MapTreatmentStepEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/treatment-plans/{planId:guid}/steps")
            .WithTags("TreatmentSteps")
            .RequireAuthorization();

        // 1. Lấy danh sách hạng mục điều trị theo phác đồ (phục vụ Kanban / Timeline)
        group.MapGet("/", async (
            Guid planId,
            [FromServices] IQueryHandler<GetTreatmentStepsByPlanQuery, Result<IReadOnlyList<TreatmentStepDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetTreatmentStepsByPlanQuery(planId);
            var result = await handler.Handle(query, cancellationToken);

            return result.IsSuccess
                ? Results.Ok(new ApiResponse<IReadOnlyList<TreatmentStepDto>>(result.Value ?? Array.Empty<TreatmentStepDto>()))
                : Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Lỗi lấy danh sách hạng mục điều trị",
                    detail: result.Error!.Message);
        })
        .WithName("GetTreatmentStepsByPlan")
        .RequireAuthorization(DefaultPermissions.Patients.Read);

        // 2. Tạo hạng mục điều trị mới
        group.MapPost("/", async (
            Guid planId,
            [FromBody] CreateTreatmentStepRequest request,
            [FromServices] ICurrentUser currentUser,
            [FromServices] ICommandHandler<CreateTreatmentStepCommand, Result<Guid>> handler,
            [FromServices] IValidator<CreateTreatmentStepCommand> validator,
            CancellationToken cancellationToken) =>
        {
            if (currentUser.ClinicId is not { } clinicId || clinicId == Guid.Empty)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Chưa chọn phòng khám",
                    detail: "Hãy đăng nhập hoặc chuyển sang phòng khám có quyền truy cập.");
            }

            var command = new CreateTreatmentStepCommand(
                planId,
                clinicId,
                request.StepName,
                request.ServiceId,
                request.DoctorId,
                request.ToothNumber,
                request.Cost,
                request.OrderIndex,
                request.Notes);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "treatment_plan.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy phác đồ",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Lỗi tạo hạng mục điều trị",
                        detail: error.Message)
                };
            }

            return Results.Created($"/api/v1/treatment-plans/{planId}/steps/{result.Value}", new ApiResponse<Guid>(result.Value));
        })
        .WithName("CreateTreatmentStep")
        .RequireAuthorization(DefaultPermissions.Patients.Update);

        // 3. Cập nhật chi tiết hạng mục điều trị
        group.MapPut("/{stepId:guid}", async (
            Guid planId,
            Guid stepId,
            [FromBody] UpdateTreatmentStepRequest request,
            [FromServices] ICommandHandler<UpdateTreatmentStepCommand, Result<bool>> handler,
            [FromServices] IValidator<UpdateTreatmentStepCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateTreatmentStepCommand(
                stepId,
                request.StepName,
                request.ServiceId,
                request.DoctorId,
                request.ToothNumber,
                request.Cost,
                request.OrderIndex,
                request.Notes);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "treatment_step.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy hạng mục",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Lỗi cập nhật hạng mục điều trị",
                        detail: error.Message)
                };
            }

            return Results.Ok(new ApiResponse<bool>(true));
        })
        .WithName("UpdateTreatmentStep")
        .RequireAuthorization(DefaultPermissions.Patients.Update);

        // 4. Cập nhật trạng thái hạng mục (Kanban kéo thả / Timeline)
        group.MapPatch("/{stepId:guid}/status", async (
            Guid planId,
            Guid stepId,
            [FromBody] ChangeTreatmentStepStatusRequest request,
            [FromServices] ICommandHandler<ChangeTreatmentStepStatusCommand, Result<bool>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ChangeTreatmentStepStatusCommand(stepId, request.Status);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "treatment_step.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy hạng mục",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Lỗi cập nhật trạng thái hạng mục",
                        detail: error.Message)
                };
            }

            return Results.Ok(new ApiResponse<bool>(true));
        })
        .WithName("ChangeTreatmentStepStatus")
        .RequireAuthorization(DefaultPermissions.Patients.Update);

        // 5. Xóa hạng mục điều trị
        group.MapDelete("/{stepId:guid}", async (
            Guid planId,
            Guid stepId,
            [FromServices] ICommandHandler<DeleteTreatmentStepCommand, Result<bool>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DeleteTreatmentStepCommand(stepId);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "treatment_step.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy hạng mục",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Lỗi xóa hạng mục điều trị",
                        detail: error.Message)
                };
            }

            return Results.Ok(new ApiResponse<bool>(true));
        })
        .WithName("DeleteTreatmentStep")
        .RequireAuthorization(DefaultPermissions.Patients.Update);

        return endpoints;
    }
}
