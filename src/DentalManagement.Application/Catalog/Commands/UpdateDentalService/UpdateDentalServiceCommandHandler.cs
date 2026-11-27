using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Commands.UpdateDentalService;

public sealed class UpdateDentalServiceCommandHandler : ICommandHandler<UpdateDentalServiceCommand, Result>
{
    private readonly IServiceRepository _serviceRepository;
    private readonly IServiceCategoryRepository _categoryRepository;

    public UpdateDentalServiceCommandHandler(
        IServiceRepository serviceRepository,
        IServiceCategoryRepository categoryRepository)
    {
        _serviceRepository = serviceRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<Result> Handle(UpdateDentalServiceCommand command, CancellationToken cancellationToken)
    {
        var service = await _serviceRepository.GetByIdAsync(command.Id, cancellationToken);
        if (service is null)
        {
            return Result.Failure("service.not_found", $"Không tìm thấy dịch vụ với id '{command.Id}'.");
        }

        string? categoryName = null;
        if (command.CategoryId.HasValue)
        {
            var category = await _categoryRepository.GetByIdAsync(command.CategoryId.Value, cancellationToken);
            if (category is null)
            {
                return Result.Failure("category.not_found", "Nhóm dịch vụ được chỉ định không tồn tại.");
            }

            categoryName = category.Name;
        }

        var updatePriceResult = service.UpdatePrice(command.UnitPrice);
        if (updatePriceResult.IsFailure)
        {
            return updatePriceResult;
        }

        var updateDetailsResult = service.UpdateDetails(
            command.Name,
            command.CategoryId,
            categoryName,
            command.Unit,
            command.EstimatedDurationMinutes,
            command.Description);

        if (updateDetailsResult.IsFailure)
        {
            return updateDetailsResult;
        }

        await _serviceRepository.ReplaceAsync(service, cancellationToken);
        return Result.Success();
    }
}
