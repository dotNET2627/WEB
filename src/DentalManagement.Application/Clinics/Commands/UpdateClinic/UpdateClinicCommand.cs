using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Clinics.Dtos;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using FluentValidation;

namespace DentalManagement.Application.Clinics.Commands.UpdateClinic;

public sealed record UpdateClinicCommand(
    Guid Id,
    string Name,
    string Address,
    string? PhoneNumber = null,
    string? Email = null,
    string? Description = null,
    IReadOnlyDictionary<string, string>? OpeningHours = null,
    string? Logo = null,
    bool IsActive = true);

public sealed class UpdateClinicCommandValidator : AbstractValidator<UpdateClinicCommand>
{
    public UpdateClinicCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID phòng khám không hợp lệ.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên phòng khám không được để trống.")
            .MaximumLength(200).WithMessage("Tên phòng khám không vượt quá 200 ký tự.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Địa chỉ phòng khám không được để trống.")
            .MaximumLength(500).WithMessage("Địa chỉ không vượt quá 500 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Số điện thoại không vượt quá 20 ký tự.")
            .Matches(@"^[0-9+()\-.\s]*$").WithMessage("Số điện thoại không hợp lệ.")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email không hợp lệ.")
            .MaximumLength(150).WithMessage("Email không vượt quá 150 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}

public sealed class UpdateClinicCommandHandler : ICommandHandler<UpdateClinicCommand, Result<ClinicDto>>
{
    private readonly IClinicRepository _clinicRepository;

    public UpdateClinicCommandHandler(IClinicRepository clinicRepository)
    {
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<ClinicDto>> Handle(UpdateClinicCommand command, CancellationToken cancellationToken)
    {
        var clinic = await _clinicRepository.GetByIdAsync(command.Id, cancellationToken);
        if (clinic is null)
        {
            return Result<ClinicDto>.Failure("clinic.not_found", "Không tìm thấy thông tin phòng khám.");
        }

        if (await _clinicRepository.NameExistsAsync(command.Name, command.Id, cancellationToken))
        {
            return Result<ClinicDto>.Failure("clinic.duplicate_name", "Tên phòng khám đã được sử dụng bởi chi nhánh khác.");
        }

        clinic.UpdateDetails(
            command.Name,
            command.Address,
            command.PhoneNumber,
            command.Email,
            command.Description,
            command.OpeningHours,
            command.Logo);

        if (command.IsActive && !clinic.IsActive)
        {
            clinic.Activate();
        }
        else if (!command.IsActive && clinic.IsActive)
        {
            clinic.Deactivate();
        }

        await _clinicRepository.ReplaceAsync(clinic, cancellationToken);

        var dto = new ClinicDto(
            clinic.Id,
            clinic.Name,
            clinic.Address,
            clinic.PhoneNumber,
            clinic.Email,
            clinic.Description,
            clinic.OpeningHours,
            clinic.Logo,
            clinic.IsActive,
            clinic.CreatedAt,
            clinic.UpdatedAt);

        return Result<ClinicDto>.Success(dto);
    }
}
