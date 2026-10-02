using DentalManagement.Api.Contracts;
using DentalManagement.Api.Filters;
using DentalManagement.Application.Catalog.Commands.CreateDentalService;
using DentalManagement.Application.Catalog.Commands.CreateServiceCategory;
using DentalManagement.Application.Catalog.Commands.DeleteDentalService;
using DentalManagement.Application.Catalog.Commands.ToggleDentalServiceStatus;
using DentalManagement.Application.Catalog.Commands.UpdateDentalService;
using DentalManagement.Application.Catalog.Common;
using DentalManagement.Application.Catalog.Queries.GetActiveDentalServices;
using DentalManagement.Application.Catalog.Queries.GetDentalServiceById;
using DentalManagement.Application.Catalog.Queries.GetDentalServicesPaged;
using DentalManagement.Application.Catalog.Queries.GetServiceCategories;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class ServiceEndpoints
{
    public static IEndpointRouteBuilder MapServiceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/services")
            .WithTags("Dental Services");

        // 1. Get paged list of services
        group.MapGet("/", async (
            string? search,
            Guid? categoryId,
            bool? isActive,
            int? page,
            int? pageSize,
            IQueryHandler<GetDentalServicesPagedQuery, Result<PagedResult<DentalServiceDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetDentalServicesPagedQuery(
                SearchTerm: search,
                CategoryId: categoryId,
                IsActive: isActive,
                Page: page ?? 1,
                PageSize: pageSize ?? 20);

            var result = await handler.Handle(query, cancellationToken);
            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Lỗi tải danh sách dịch vụ",
                    detail: result.Error!.Message);
            }

            var paged = result.Value!;
            var response = new PagedResponse<DentalServiceDto>(
                paged.Items,
                paged.Page,
                paged.PageSize,
                paged.TotalCount);

            return Results.Ok(new ApiResponse<PagedResponse<DentalServiceDto>>(response));
        })
        .WithName("GetDentalServicesPaged")
        .WithSummary("Lấy danh sách dịch vụ khám bệnh có phân trang và bộ lọc");

        // 2. Get active services for dropdowns
        group.MapGet("/active", async (
            IQueryHandler<GetActiveDentalServicesQuery, Result<IReadOnlyList<DentalServiceDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetActiveDentalServicesQuery(), cancellationToken);
            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Lỗi tải danh mục dịch vụ hoạt động",
                    detail: result.Error!.Message);
            }

            return Results.Ok(new ApiResponse<IReadOnlyList<DentalServiceDto>>(result.Value!));
        })
        .WithName("GetActiveDentalServices")
        .WithSummary("Lấy toàn bộ dịch vụ đang hoạt động phục vụ chọn nhanh");

        // 3. Get all service categories
        group.MapGet("/categories", async (
            IQueryHandler<GetServiceCategoriesQuery, Result<IReadOnlyList<ServiceCategoryDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetServiceCategoriesQuery(), cancellationToken);
            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Lỗi tải nhóm dịch vụ",
                    detail: result.Error!.Message);
            }

            return Results.Ok(new ApiResponse<IReadOnlyList<ServiceCategoryDto>>(result.Value!));
        })
        .WithName("GetServiceCategories")
        .WithSummary("Lấy danh sách các nhóm dịch vụ");

        // 4. Create service category
        group.MapPost("/categories", async (
            CreateServiceCategoryRequest request,
            ICommandHandler<CreateServiceCategoryCommand, Result<Guid>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateServiceCategoryCommand(request.Name, request.Description);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "category.duplicate_name" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Trùng tên nhóm dịch vụ",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể tạo nhóm dịch vụ",
                        detail: error.Message)
                };
            }

            return Results.Created($"/api/v1/services/categories", new ApiResponse<Guid>(result.Value, "Tạo nhóm dịch vụ thành công."));
        })
        .AddEndpointFilter<ValidationFilter<CreateServiceCategoryRequest>>()
        .WithName("CreateServiceCategory")
        .WithSummary("Tạo mới một nhóm dịch vụ");

        // 5. Get service detail by Id
        group.MapGet("/{id:guid}", async (
            Guid id,
            IQueryHandler<GetDentalServiceByIdQuery, Result<DentalServiceDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetDentalServiceByIdQuery(id), cancellationToken);
            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Không tìm thấy dịch vụ",
                    detail: result.Error!.Message);
            }

            return Results.Ok(new ApiResponse<DentalServiceDto>(result.Value!));
        })
        .WithName("GetDentalServiceById")
        .WithSummary("Lấy chi tiết dịch vụ theo Id");

        // 6. Create dental service
        group.MapPost("/", async (
            CreateDentalServiceRequest request,
            ICommandHandler<CreateDentalServiceCommand, Result<Guid>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateDentalServiceCommand(
                request.Code,
                request.Name,
                request.UnitPrice,
                request.CategoryId,
                request.Unit,
                request.EstimatedDurationMinutes,
                request.Description,
                request.IsActive);

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "service.duplicate_code" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Mã dịch vụ bị trùng",
                        detail: error.Message),
                    "category.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Nhóm dịch vụ không tồn tại",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể tạo dịch vụ",
                        detail: error.Message)
                };
            }

            return Results.Created(
                $"/api/v1/services/{result.Value}",
                new ApiResponse<Guid>(result.Value, "Tạo dịch vụ khám bệnh thành công."));
        })
        .AddEndpointFilter<ValidationFilter<CreateDentalServiceRequest>>()
        .WithName("CreateDentalService")
        .WithSummary("Tạo mới dịch vụ khám bệnh");

        // 7. Update dental service
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateDentalServiceRequest request,
            ICommandHandler<UpdateDentalServiceCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateDentalServiceCommand(
                id,
                request.Name,
                request.UnitPrice,
                request.CategoryId,
                request.Unit,
                request.EstimatedDurationMinutes,
                request.Description);

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "service.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy dịch vụ",
                        detail: error.Message),
                    "category.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Nhóm dịch vụ không tồn tại",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể cập nhật dịch vụ",
                        detail: error.Message)
                };
            }

            return Results.Ok(new ApiResponse<bool>(true, "Cập nhật dịch vụ thành công."));
        })
        .AddEndpointFilter<ValidationFilter<UpdateDentalServiceRequest>>()
        .WithName("UpdateDentalService")
        .WithSummary("Cập nhật thông tin dịch vụ khám bệnh");

        // 8. Toggle service status
        group.MapPatch("/{id:guid}/status", async (
            Guid id,
            ToggleDentalServiceStatusRequest? request,
            ICommandHandler<ToggleDentalServiceStatusCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ToggleDentalServiceStatusCommand(id, request?.IsActive);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "service.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy dịch vụ",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể cập nhật trạng thái",
                        detail: error.Message)
                };
            }

            return Results.Ok(new ApiResponse<bool>(true, "Cập nhật trạng thái dịch vụ thành công."));
        })
        .WithName("ToggleDentalServiceStatus")
        .WithSummary("Bật hoặc tắt trạng thái kinh doanh dịch vụ");

        // 9. Delete dental service
        group.MapDelete("/{id:guid}", async (
            Guid id,
            ICommandHandler<DeleteDentalServiceCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DeleteDentalServiceCommand(id);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Không tìm thấy dịch vụ để xóa",
                    detail: result.Error!.Message);
            }

            return Results.Ok(new ApiResponse<bool>(true, "Xóa dịch vụ thành công."));
        })
        .WithName("DeleteDentalService")
        .WithSummary("Xóa dịch vụ khám bệnh");

        return endpoints;
    }
}
