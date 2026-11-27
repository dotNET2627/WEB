using DentalManagement.Api.Extensions;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Inventory.Batches.ConsumeStockFefo;
using DentalManagement.Application.Inventory.Batches.ListInventoryBatches;
using DentalManagement.Application.Inventory.Batches.ReceiveInventoryBatch;
using DentalManagement.Application.Inventory.Items.CreateInventoryItem;
using DentalManagement.Application.Inventory.Items.ListInventoryItems;
using DentalManagement.Application.Inventory.Items.UpdateInventoryItem;
using DentalManagement.Application.Inventory.Transactions.ListInventoryTransactions;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DentalManagement.Api.Endpoints;

public static class InventoryEndpoints
{
    public static IEndpointRouteBuilder MapInventoryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/inventory")
            .WithTags("Inventory");
        group.RequireClinic();

        // 1. Tạo mới vật tư / thuốc
        group.MapPost("/items", async (
            CreateInventoryItemRequest request,
            [FromServices] ICurrentUser user,
            ICommandHandler<CreateInventoryItemCommand, Result<Guid>> handler,
            IValidator<CreateInventoryItemCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateInventoryItemCommand(
                user.ClinicId!.Value,
                request.Code,
                request.Name,
                request.Category,
                request.Unit,
                request.MinimumStock,
                request.Description);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code == "inventory.duplicate_code"
                    ? Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Trùng mã vật tư", detail: error.Message)
                    : Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Không thể tạo vật tư", detail: error.Message);
            }

            return Results.Created($"/api/v1/inventory/items/{result.Value}", new
            {
                id = result.Value,
                message = "Tạo vật tư thành công."
            });
        })
        .WithName("CreateInventoryItem")
        .RequireAuthorization(DefaultPermissions.Inventory.Import);

        // 2. Cập nhật vật tư / thuốc
        group.MapPut("/items/{id:guid}", async (
            Guid id,
            UpdateInventoryItemRequest request,
            [FromServices] ICurrentUser user,
            ICommandHandler<UpdateInventoryItemCommand, Result> handler,
            IValidator<UpdateInventoryItemCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateInventoryItemCommand(
                user.ClinicId!.Value,
                id,
                request.Name,
                request.Category,
                request.Unit,
                request.MinimumStock,
                request.Description,
                request.IsActive);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code == "inventory.item_not_found"
                    ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy vật tư", detail: error.Message)
                    : Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Không thể cập nhật vật tư", detail: error.Message);
            }

            return Results.Ok(new { message = "Cập nhật vật tư thành công." });
        })
        .WithName("UpdateInventoryItem")
        .RequireAuthorization(DefaultPermissions.Inventory.Adjust);

        // 3. Danh sách vật tư kèm tổng tồn kho khả dụng
        group.MapGet("/items", async (
            string? search,
            [FromServices] ICurrentUser user,
            IQueryHandler<ListInventoryItemsQuery, Result<IReadOnlyList<InventoryItemDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new ListInventoryItemsQuery(user.ClinicId!.Value, search), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Error!.Message);
        })
        .WithName("ListInventoryItems")
        .RequireAuthorization(DefaultPermissions.Inventory.Read);

        // 4. Nhập lô hàng mới
        group.MapPost("/batches", async (
            ReceiveInventoryBatchRequest request,
            [FromServices] ICurrentUser user,
            ICommandHandler<ReceiveInventoryBatchCommand, Result<Guid>> handler,
            IValidator<ReceiveInventoryBatchCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var command = new ReceiveInventoryBatchCommand(
                user.ClinicId!.Value,
                request.InventoryItemId,
                request.BatchNumber,
                request.ExpirationDate,
                request.Quantity,
                request.UnitCost,
                request.ReferenceCode,
                request.Note);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code == "inventory.item_not_found"
                    ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Không tìm thấy vật tư", detail: error.Message)
                    : Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Không thể nhập lô hàng", detail: error.Message);
            }

            return Results.Created($"/api/v1/inventory/batches/{result.Value}", new
            {
                id = result.Value,
                message = "Nhập lô hàng thành công."
            });
        })
        .WithName("ReceiveInventoryBatch")
        .RequireAuthorization(DefaultPermissions.Inventory.Import);

        // 5. Danh sách lô hàng theo vật tư (sắp xếp theo hạn dùng FEFO)
        group.MapGet("/items/{itemId:guid}/batches", async (
            Guid itemId,
            [FromServices] ICurrentUser user,
            IQueryHandler<ListInventoryBatchesQuery, Result<IReadOnlyList<InventoryBatchDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new ListInventoryBatchesQuery(user.ClinicId!.Value, itemId), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Error!.Message);
        })
        .WithName("ListInventoryBatches")
        .RequireAuthorization(DefaultPermissions.Inventory.Read);

        // 6. Xuất kho tự động theo thuật toán FEFO (xuất thủ thuật / hủy hỏng)
        group.MapPost("/consume", async (
            ConsumeStockFefoRequest request,
            [FromServices] ICurrentUser user,
            ICommandHandler<ConsumeStockFefoCommand, Result<IReadOnlyList<BatchConsumptionResultDto>>> handler,
            IValidator<ConsumeStockFefoCommand> validator,
            CancellationToken cancellationToken) =>
        {
            var txType = InventoryTransactionType.ProcedureExport;
            if (!string.IsNullOrWhiteSpace(request.TransactionType) &&
                Enum.TryParse<InventoryTransactionType>(request.TransactionType, ignoreCase: true, out var parsedType))
            {
                txType = parsedType;
            }

            var command = new ConsumeStockFefoCommand(
                user.ClinicId!.Value,
                request.InventoryItemId,
                request.Quantity,
                txType,
                request.ReferenceCode,
                request.Note);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await handler.Handle(command, cancellationToken);
            if (result.IsFailure)
            {
                var error = result.Error!;
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Không thể xuất kho",
                    detail: error.Message);
            }

            return Results.Ok(new
            {
                message = "Xuất kho theo FEFO thành công.",
                consumedBatches = result.Value
            });
        })
        .WithName("ConsumeStockFefo")
        .RequireAuthorization(DefaultPermissions.Inventory.Export);

        // 7. Lịch sử giao dịch kho (Nhập / Xuất / Hủy)
        group.MapGet("/transactions", async (
            Guid? itemId,
            string? type,
            [FromServices] ICurrentUser user,
            IQueryHandler<ListInventoryTransactionsQuery, Result<IReadOnlyList<InventoryTransactionDto>>> handler,
            CancellationToken cancellationToken) =>
        {
            InventoryTransactionType? parsedType = null;
            if (!string.IsNullOrWhiteSpace(type) &&
                Enum.TryParse<InventoryTransactionType>(type, ignoreCase: true, out var parsed))
            {
                parsedType = parsed;
            }

            var result = await handler.Handle(new ListInventoryTransactionsQuery(user.ClinicId!.Value, itemId, parsedType), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Error!.Message);
        })
        .WithName("ListInventoryTransactions")
        .RequireAuthorization(DefaultPermissions.Inventory.Read);

        return endpoints;
    }
}

public sealed record CreateInventoryItemRequest(
    string Code,
    string Name,
    string Category,
    string Unit,
    int MinimumStock,
    string? Description);

public sealed record UpdateInventoryItemRequest(
    string Name,
    string Category,
    string Unit,
    int MinimumStock,
    string? Description,
    bool IsActive);

public sealed record ReceiveInventoryBatchRequest(
    Guid InventoryItemId,
    string BatchNumber,
    DateOnly ExpirationDate,
    int Quantity,
    decimal UnitCost,
    string? ReferenceCode = null,
    string? Note = null);

public sealed record ConsumeStockFefoRequest(
    Guid InventoryItemId,
    int Quantity,
    string? TransactionType = null,
    string? ReferenceCode = null,
    string? Note = null);
