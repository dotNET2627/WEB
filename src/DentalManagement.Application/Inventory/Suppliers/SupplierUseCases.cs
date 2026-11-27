using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Inventory;
using FluentValidation;

namespace DentalManagement.Application.Inventory.Suppliers;

public sealed record SupplierDto(
    Guid Id,
    Guid ClinicId,
    string Code,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? ContactPerson,
    bool IsActive,
    DateTimeOffset UpdatedAt);

public sealed record ListSuppliersQuery(Guid ClinicId);

public sealed class ListSuppliersHandler : IQueryHandler<ListSuppliersQuery, Result<IReadOnlyList<SupplierDto>>>
{
    private readonly ISupplierRepository _supplierRepository;

    public ListSuppliersHandler(ISupplierRepository supplierRepository)
    {
        _supplierRepository = supplierRepository;
    }

    public async Task<Result<IReadOnlyList<SupplierDto>>> Handle(ListSuppliersQuery query, CancellationToken cancellationToken)
    {
        var suppliers = await _supplierRepository.ListByClinicAsync(query.ClinicId, cancellationToken);
        var dtos = suppliers
            .Select(s => new SupplierDto(
                s.Id,
                s.ClinicId,
                s.Code,
                s.Name,
                s.Phone,
                s.Email,
                s.Address,
                s.ContactPerson,
                s.IsActive,
                s.UpdatedAt))
            .ToList();
        return Result<IReadOnlyList<SupplierDto>>.Success(dtos);
    }
}

public sealed record CreateSupplierCommand(
    Guid ClinicId,
    string Code,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? ContactPerson);

public sealed class CreateSupplierValidator : AbstractValidator<CreateSupplierCommand>
{
    public CreateSupplierValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}

public sealed class CreateSupplierHandler : ICommandHandler<CreateSupplierCommand, Result<Guid>>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IClock _clock;

    public CreateSupplierHandler(ISupplierRepository supplierRepository, IClock clock)
    {
        _supplierRepository = supplierRepository;
        _clock = clock;
    }

    public async Task<Result<Guid>> Handle(CreateSupplierCommand command, CancellationToken cancellationToken)
    {
        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        if (await _supplierRepository.ExistsByCodeAsync(command.ClinicId, normalizedCode, null, cancellationToken))
        {
            return Result<Guid>.Failure("supplier.duplicate_code", $"Mã nhà cung cấp '{normalizedCode}' đã tồn tại.");
        }

        var result = Supplier.Create(
            command.ClinicId,
            command.Code,
            command.Name,
            command.Phone,
            command.Email,
            command.Address,
            command.ContactPerson,
            _clock.UtcNow);

        if (result.IsFailure)
        {
            return Result<Guid>.Failure(result.Error!.Code, result.Error.Message);
        }

        await _supplierRepository.AddAsync(result.Value!, cancellationToken);
        return Result<Guid>.Success(result.Value!.Id);
    }
}

public sealed record UpdateSupplierCommand(
    Guid ClinicId,
    Guid Id,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? ContactPerson,
    bool IsActive);

public sealed class UpdateSupplierValidator : AbstractValidator<UpdateSupplierCommand>
{
    public UpdateSupplierValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty();
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}

public sealed class UpdateSupplierHandler : ICommandHandler<UpdateSupplierCommand, Result>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IClock _clock;

    public UpdateSupplierHandler(ISupplierRepository supplierRepository, IClock clock)
    {
        _supplierRepository = supplierRepository;
        _clock = clock;
    }

    public async Task<Result> Handle(UpdateSupplierCommand command, CancellationToken cancellationToken)
    {
        var supplier = await _supplierRepository.GetByIdAsync(command.Id, cancellationToken);
        if (supplier is null || supplier.ClinicId != command.ClinicId)
        {
            return Result.Failure("supplier.not_found", "Không tìm thấy nhà cung cấp.");
        }

        var updateResult = supplier.Update(
            command.Name,
            command.Phone,
            command.Email,
            command.Address,
            command.ContactPerson,
            command.IsActive,
            _clock.UtcNow);

        if (updateResult.IsFailure)
        {
            return updateResult;
        }

        await _supplierRepository.ReplaceAsync(supplier, cancellationToken);
        return Result.Success();
    }
}
