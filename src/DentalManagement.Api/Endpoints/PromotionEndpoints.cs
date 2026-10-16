using DentalManagement.Api.Contracts;
using DentalManagement.Api.Filters;
using DentalManagement.Application.Common;
using DentalManagement.Application.Promotions.Commands.CreateDiscountPromo;
using DentalManagement.Application.Promotions.Commands.DeleteDiscountPromo;
using DentalManagement.Application.Promotions.Commands.ToggleDiscountPromoStatus;
using DentalManagement.Application.Promotions.Commands.UpdateDiscountPromo;
using DentalManagement.Application.Promotions.Common;
using DentalManagement.Application.Promotions.Queries.GetDiscountPromoById;
using DentalManagement.Application.Promotions.Queries.GetDiscountPromosPaged;
using DentalManagement.Application.Promotions.Queries.ValidateDiscountPromo;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Promotions;

namespace DentalManagement.Api.Endpoints;

public static class PromotionEndpoints
{
    public static IEndpointRouteBuilder MapPromotionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/promotions")
            .WithTags("Promotions & Discounts");

        // 1. Get paged list of promotions
        group.MapGet("/", async (
            string? search,
            DiscountType? discountType,
            bool? isActive,
            int? page,
            int? pageSize,
            IQueryHandler<GetDiscountPromosPagedQuery, Result<PagedResult<DiscountPromoDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetDiscountPromosPagedQuery(
                SearchTerm: search,
                DiscountType: discountType,
                IsActive: isActive,
                Page: page ?? 1,
                PageSize: pageSize ?? 20);

            var result = await handler.Handle(query, cancellationToken);
            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Lỗi tải danh sách mã khuyến mãi",
                    detail: result.Error!.Message);
            }

            var paged = result.Value!;
            var response = new PagedResponse<DiscountPromoDto>(
                paged.Items,
                paged.Page,
                paged.PageSize,
                paged.TotalCount);

            return Results.Ok(new ApiResponse<PagedResponse<DiscountPromoDto>>(response));
        })
        .WithName("GetDiscountPromosPaged")
        .WithSummary("Lấy danh sách mã ưu đãi & khuyến mãi có phân trang và bộ lọc");

        // 2. Get promotion detail by Id
        group.MapGet("/{id:guid}", async (
            Guid id,
            IQueryHandler<GetDiscountPromoByIdQuery, Result<DiscountPromoDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetDiscountPromoByIdQuery(id), cancellationToken);
            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Không tìm thấy mã khuyến mãi",
                    detail: result.Error!.Message);
            }

            return Results.Ok(new ApiResponse<DiscountPromoDto>(result.Value!));
        })
        .WithName("GetDiscountPromoById")
        .WithSummary("Lấy chi tiết mã ưu đãi theo ID");

        // 3. Create promotion
        group.MapPost("/", async (
            CreateDiscountPromoRequest request,
            ICommandHandler<CreateDiscountPromoCommand, Result<Guid>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateDiscountPromoCommand(
                request.Code,
                request.Title,
                request.DiscountType,
                request.DiscountValue,
                request.StartDate,
                request.EndDate,
                request.MaxDiscountAmount,
                request.MinOrderAmount,
                request.UsageLimit,
                request.Scope,
                request.ApplicableServiceIds,
                request.ApplicableCategoryIds,
                request.Description,
                request.IsActive);

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "promo.duplicate_code" => Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Mã khuyến mãi đã tồn tại",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể tạo mã khuyến mãi",
                        detail: error.Message)
                };
            }

            return Results.Created(
                $"/api/v1/promotions/{result.Value}",
                new ApiResponse<Guid>(result.Value, "Tạo mã khuyến mãi thành công."));
        })
        .AddEndpointFilter<ValidationFilter<CreateDiscountPromoRequest>>()
        .WithName("CreateDiscountPromo")
        .WithSummary("Tạo mới chương trình ưu đãi & mã khuyến mãi");

        // 4. Update promotion
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateDiscountPromoRequest request,
            ICommandHandler<UpdateDiscountPromoCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateDiscountPromoCommand(
                id,
                request.Title,
                request.Description,
                request.DiscountType,
                request.DiscountValue,
                request.StartDate,
                request.EndDate,
                request.MaxDiscountAmount,
                request.MinOrderAmount,
                request.UsageLimit,
                request.Scope,
                request.ApplicableServiceIds,
                request.ApplicableCategoryIds);

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "promo.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy mã khuyến mãi",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể cập nhật mã khuyến mãi",
                        detail: error.Message)
                };
            }

            return Results.Ok(new ApiResponse<bool>(true, "Cập nhật mã khuyến mãi thành công."));
        })
        .AddEndpointFilter<ValidationFilter<UpdateDiscountPromoRequest>>()
        .WithName("UpdateDiscountPromo")
        .WithSummary("Cập nhật thông tin chương trình khuyến mãi");

        // 5. Toggle status
        group.MapPatch("/{id:guid}/status", async (
            Guid id,
            ToggleDiscountPromoStatusRequest? request,
            ICommandHandler<ToggleDiscountPromoStatusCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ToggleDiscountPromoStatusCommand(id, request?.IsActive);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "promo.not_found" => Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Không tìm thấy mã khuyến mãi",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Không thể cập nhật trạng thái",
                        detail: error.Message)
                };
            }

            return Results.Ok(new ApiResponse<bool>(true, "Cập nhật trạng thái mã khuyến mãi thành công."));
        })
        .WithName("ToggleDiscountPromoStatus")
        .WithSummary("Bật hoặc tắt trạng thái áp dụng mã khuyến mãi");

        // 6. Delete promotion
        group.MapDelete("/{id:guid}", async (
            Guid id,
            ICommandHandler<DeleteDiscountPromoCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DeleteDiscountPromoCommand(id);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Không tìm thấy mã khuyến mãi để xóa",
                    detail: result.Error!.Message);
            }

            return Results.Ok(new ApiResponse<bool>(true, "Xóa mã khuyến mãi thành công."));
        })
        .WithName("DeleteDiscountPromo")
        .WithSummary("Xóa mã khuyến mãi");

        // 7. Validate & calculate discount for order
        group.MapPost("/validate", async (
            ValidateDiscountPromoRequest request,
            IQueryHandler<ValidateDiscountPromoQuery, Result<DiscountValidationResultDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new ValidateDiscountPromoQuery(
                request.Code,
                request.OrderAmount,
                request.ServiceIds,
                request.CategoryIds);

            var result = await handler.Handle(query, cancellationToken);
            return Results.Ok(new ApiResponse<DiscountValidationResultDto>(result.Value!));
        })
        .AddEndpointFilter<ValidationFilter<ValidateDiscountPromoRequest>>()
        .WithName("ValidateDiscountPromo")
        .WithSummary("Kiểm tra điều kiện áp dụng mã khuyến mãi và tính số tiền giảm");

        return endpoints;
    }
}
