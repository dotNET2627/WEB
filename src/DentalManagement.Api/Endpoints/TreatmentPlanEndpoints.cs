using DentalManagement.Api.Contracts;
using DentalManagement.Api.Extensions;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Application.Treatments.Common;
using DentalManagement.Application.Treatments.CreateTreatmentPlan;
using DentalManagement.Application.Treatments.GetTreatmentPlansByPatient;
using DentalManagement.Domain.Common;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class TreatmentPlanEndpoints
{
    public static IEndpointRouteBuilder MapTreatmentPlanEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/patients/{patientId:guid}/treatment-plans")
            .WithTags("TreatmentPlans")
            .RequireAuthorization();
        group.RequireClinic();

        // 1. Tạo mới phác đồ điều trị cho bệnh nhân
        group.MapPost("/", async (
            Guid patientId,
            [FromBody] CreateTreatmentPlanRequest request,
            [FromServices] ICurrentUser currentUser,
            [FromServices] ICommandHandler<CreateTreatmentPlanCommand, Result<Guid>> handler,
            [FromServices] IValidator<CreateTreatmentPlanCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateTreatmentPlanCommand(
                patientId,
                currentUser.ClinicId!.Value,
                request.Name,
                request.EstimatedCost,
                request.StartDate,
                request.EndDate,
                request.DoctorId,
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
                    "patient.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Lỗi tạo phác đồ điều trị",
                        detail: error.Message)
                };
            }

            return Results.Created($"/api/v1/patients/{patientId}/treatment-plans/{result.Value}", new ApiResponse<Guid>(result.Value));
        })
        .WithName("CreateTreatmentPlan")
        .RequireAuthorization(DefaultPermissions.Patients.Update);

        // 2. Lấy danh sách phác đồ điều trị của bệnh nhân
        group.MapGet("/", async (
            Guid patientId,
            [FromServices] ICurrentUser currentUser,
            [FromServices] IQueryHandler<GetTreatmentPlansByPatientQuery, Result<IReadOnlyList<TreatmentPlanDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetTreatmentPlansByPatientQuery(currentUser.ClinicId!.Value, patientId);
            var result = await handler.Handle(query, cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Lỗi lấy danh sách phác đồ",
                    detail: result.Error!.Message);
        })
        .WithName("GetTreatmentPlansByPatient")
        .RequireAuthorization(DefaultPermissions.Patients.Read);

        return endpoints;
    }
}
