using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Clinics.Dtos;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Clinics;
using DentalManagement.Domain.Common;
using FluentValidation;

namespace DentalManagement.Application.Clinics.Commands.CreateClinic;

public sealed record CreateClinicCommand(
    string Name,
    string Address,
    string? PhoneNumber = null,
    string? Email = null,
    string? Description = null,
    IReadOnlyDictionary<string, string>? OpeningHours = null,
    string? Logo = null) : ICommand;

public interface ICommand;

public sealed class CreateClinicCommandValidator : AbstractValidator<CreateClinicCommand>
{
    public CreateClinicCommandValidator()
    {
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

public sealed class CreateClinicCommandHandler : ICommandHandler<CreateClinicCommand, Result<ClinicDto>>
{
    private readonly IClinicRepository _clinicRepository;

    public CreateClinicCommandHandler(IClinicRepository clinicRepository)
    {
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<ClinicDto>> Handle(CreateClinicCommand command, CancellationToken cancellationToken)
    {
        if (await _clinicRepository.NameExistsAsync(command.Name, null, cancellationToken))
        {
            return Result<ClinicDto>.Failure("clinic.duplicate_name", "Tên phòng khám đã tồn tại trong hệ thống.");
        }

        var clinic = new Clinic(
            Guid.NewGuid(),
            command.Name,
            command.Address,
            command.PhoneNumber,
            command.Email,
            command.Description,
            command.OpeningHours,
            command.Logo,
            isActive: true);

        await _clinicRepository.AddAsync(clinic, cancellationToken);

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
