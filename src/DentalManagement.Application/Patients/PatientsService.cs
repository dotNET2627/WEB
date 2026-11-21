using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Patients;
using FluentValidation;

namespace DentalManagement.Application.Patients;

/// <summary>All patient use cases. Database operations remain in IPatientRepository.</summary>
public sealed class PatientService(
    IPatientRepository patients,
    IValidator<CreatePatientCommand> validator)
{
    public async Task<Result<Guid>> CreateAsync(CreatePatientCommand command, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
            return Result<Guid>.Failure("patient.invalid", string.Join(" ", validation.Errors.Select(x => x.ErrorMessage)));

        var code = string.IsNullOrWhiteSpace(command.PatientCode) ? null : command.PatientCode.Trim();
        if (code is not null && await patients.PatientCodeExistsAsync(command.ClinicId, code, cancellationToken))
            return Result<Guid>.Failure("patient.duplicate_code", "Mã bệnh nhân đã tồn tại trong phòng khám.");

        var patient = new Patient(Guid.NewGuid(), command.ClinicId, command.FullName, code);
        patient.UpdateContact(command.FullName, command.PhoneNumber, command.DateOfBirth);
        try
        {
            await patients.AddAsync(patient, cancellationToken);
        }
        catch (DuplicatePatientCodeException)
        {
            return Result<Guid>.Failure("patient.duplicate_code", "Mã bệnh nhân đã tồn tại trong phòng khám.");
        }
        return Result<Guid>.Success(patient.Id);
    }

    public async Task<Result<PatientDto>> UpdateAsync(UpdatePatientCommand command, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(new CreatePatientCommand(
            command.ClinicId, command.FullName, command.PatientCode, command.PhoneNumber, command.DateOfBirth), cancellationToken);
        if (!validation.IsValid)
            return Result<PatientDto>.Failure("patient.invalid", string.Join(" ", validation.Errors.Select(x => x.ErrorMessage)));

        var patient = await patients.GetByIdAsync(command.ClinicId, command.Id, cancellationToken);
        if (patient is null)
            return Result<PatientDto>.Failure("patient.not_found", "Không tìm thấy bệnh nhân.");

        var code = string.IsNullOrWhiteSpace(command.PatientCode) ? null : command.PatientCode.Trim();
        if (code is not null && code != patient.PatientCode &&
            await patients.PatientCodeExistsAsync(command.ClinicId, code, cancellationToken))
            return Result<PatientDto>.Failure("patient.duplicate_code", "Mã bệnh nhân đã tồn tại trong phòng khám.");

        patient.UpdateProfile(command.FullName, code, command.PhoneNumber, command.DateOfBirth);
        try
        {
            if (!await patients.UpdateProfileAsync(patient, cancellationToken))
                return Result<PatientDto>.Failure("patient.not_found", "Không tìm thấy bệnh nhân.");
        }
        catch (DuplicatePatientCodeException)
        {
            return Result<PatientDto>.Failure("patient.duplicate_code", "Mã bệnh nhân đã tồn tại trong phòng khám.");
        }
        return Result<PatientDto>.Success(PatientDto.FromDomain(patient));
    }

    public async Task<Result> DeleteAsync(DeletePatientCommand command, CancellationToken cancellationToken) =>
        await patients.SoftDeleteAsync(command.ClinicId, command.Id, cancellationToken)
            ? Result.Success()
            : Result.Failure("patient.not_found", "Không tìm thấy bệnh nhân.");

    public async Task<Result<PatientDto>> GetByIdAsync(GetPatientQuery query, CancellationToken cancellationToken)
    {
        var patient = await patients.GetByIdAsync(query.ClinicId, query.Id, cancellationToken);
        return patient is null
            ? Result<PatientDto>.Failure("patient.not_found", "Không tìm thấy bệnh nhân.")
            : Result<PatientDto>.Success(PatientDto.FromDomain(patient));
    }

    public async Task<PagedResult<PatientDto>> GetPageAsync(GetPatientsQuery query, CancellationToken cancellationToken)
    {
        var result = await patients.GetPageAsync(query.ClinicId,
            new PagedQuery(query.Page, query.PageSize), query.Search, cancellationToken);
        return new PagedResult<PatientDto>(result.Items.Select(PatientDto.FromDomain).ToArray(),
            result.Page, result.PageSize, result.TotalCount);
    }
}

// Input models for the operations above.
public sealed record CreatePatientCommand(
    Guid ClinicId,
    string FullName,
    string? PatientCode,
    string? PhoneNumber,
    DateOnly? DateOfBirth);

public sealed record UpdatePatientCommand(
    Guid ClinicId, Guid Id, string FullName, string? PatientCode,
    string? PhoneNumber, DateOnly? DateOfBirth);

public sealed record DeletePatientCommand(Guid ClinicId, Guid Id);

public sealed record GetPatientQuery(Guid ClinicId, Guid Id);

public sealed record GetPatientsQuery(Guid ClinicId, int Page = 1, int PageSize = 20, string? Search = null);

// Shared validation for creating and updating a patient.
public sealed class CreatePatientValidator : AbstractValidator<CreatePatientCommand>
{
    public CreatePatientValidator()
    {
        RuleFor(x => x.ClinicId).NotEmpty().WithMessage("Chưa chọn phòng khám.");
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PatientCode).MaximumLength(50);
        RuleFor(x => x.PhoneNumber).MaximumLength(20)
            .Must(phone => string.IsNullOrWhiteSpace(phone) ||
                System.Text.RegularExpressions.Regex.IsMatch(phone.Trim(), @"^\+?[0-9 ()-]{8,20}$"))
            .WithMessage("Số điện thoại không hợp lệ.");
        RuleFor(x => x.DateOfBirth)
            .Must(date => date is null || date <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Ngày sinh không được ở tương lai.");
    }
}

