using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Catalog;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Commands.CreateDentalService;

public sealed class CreateDentalServiceCommandHandler : ICommandHandler<CreateDentalServiceCommand, Result<Guid>>
{
    private readonly IServiceRepository _serviceRepository;
    private readonly IServiceCategoryRepository _categoryRepository;

    public CreateDentalServiceCommandHandler(
        IServiceRepository serviceRepository,
        IServiceCategoryRepository categoryRepository)
    {
        _serviceRepository = serviceRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<Result<Guid>> Handle(CreateDentalServiceCommand command, CancellationToken cancellationToken)
    {
        if (await _serviceRepository.ServiceCodeExistsAsync(command.Code, null, cancellationToken))
        {
            return Result<Guid>.Failure("service.duplicate_code", $"Mã dịch vụ '{command.Code.Trim().ToUpperInvariant()}' đã tồn tại.");
        }

        string? categoryName = null;
        if (command.CategoryId.HasValue)
        {
            var category = await _categoryRepository.GetByIdAsync(command.CategoryId.Value, cancellationToken);
            if (category is null)
            {
                return Result<Guid>.Failure("category.not_found", "Nhóm dịch vụ được chỉ định không tồn tại.");
            }

            categoryName = category.Name;
        }

        var service = new DentalService(
            Guid.NewGuid(),
            command.Code,
            command.Name,
            command.UnitPrice,
            command.CategoryId,
            categoryName,
            command.Unit,
            command.EstimatedDurationMinutes,
            command.Description,
            command.IsActive);

        await _serviceRepository.AddAsync(service, cancellationToken);
        return Result<Guid>.Success(service.Id);
    }
}
