using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Catalog;
using DentalManagement.Domain.Common;
using FluentValidation;

namespace DentalManagement.Application.Catalog.Commands.CreateServiceCategory;

public sealed record CreateServiceCategoryCommand(string Name, string? Description = null);

public sealed class CreateServiceCategoryCommandValidator : AbstractValidator<CreateServiceCategoryCommand>
{
    public CreateServiceCategoryCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên nhóm dịch vụ không được để trống.")
            .MaximumLength(150).WithMessage("Tên nhóm dịch vụ tối đa 150 ký tự.");
    }
}

public sealed class CreateServiceCategoryCommandHandler : ICommandHandler<CreateServiceCategoryCommand, Result<Guid>>
{
    private readonly IServiceCategoryRepository _categoryRepository;

    public CreateServiceCategoryCommandHandler(IServiceCategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Result<Guid>> Handle(CreateServiceCategoryCommand command, CancellationToken cancellationToken)
    {
        if (await _categoryRepository.CategoryNameExistsAsync(command.Name, null, cancellationToken))
        {
            return Result<Guid>.Failure("category.duplicate_name", $"Nhóm dịch vụ '{command.Name.Trim()}' đã tồn tại.");
        }

        var category = new ServiceCategory(Guid.NewGuid(), command.Name, command.Description);
        await _categoryRepository.AddAsync(category, cancellationToken);

        return Result<Guid>.Success(category.Id);
    }
}
