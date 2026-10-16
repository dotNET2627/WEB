using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Patients;
using FluentValidation;

namespace DentalManagement.Application.Patients.Odontogram;

public sealed record UpdateToothConditionCommand(
    Guid ClinicId,
    Guid PatientId,
    int ToothNumber,
    string? Condition,
    IReadOnlyList<string>? Surfaces = null,
    string? Notes = null,
    string? UpdatedBy = null);

public sealed class UpdateToothConditionCommandHandler(
    IPatientRepository patients,
    IValidator<UpdateToothConditionCommand> validator)
    : ICommandHandler<UpdateToothConditionCommand, Result<ToothConditionDto>>
{
    public async Task<Result<ToothConditionDto>> Handle(
        UpdateToothConditionCommand command,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return Result<ToothConditionDto>.Failure(
                "patient.invalid", string.Join(" ", validation.Errors.Select(x => x.ErrorMessage)));
        }

        ToothConditionTypeExtensions.TryParse(command.Condition, out var conditionType);
        ToothSurfaceExtensions.TryParseAll(command.Surfaces, out var surfaces);

        // Optimistic concurrency retry loop (up to 3 attempts)
        const int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            var patient = await patients.GetByIdAsync(command.ClinicId, command.PatientId, cancellationToken);
            if (patient is null)
            {
                return Result<ToothConditionDto>.Failure("patient.not_found", "Không tìm thấy bệnh nhân.");
            }

            DateTimeOffset updatedAt = DateTimeOffset.UtcNow;
            if (conditionType == ToothConditionType.Healthy)
            {
                // A healthy tooth is represented by the absence of a record.
                patient.RemoveToothCondition(command.ToothNumber);
            }
            else
            {
                var condition = new ToothCondition(
                    command.ToothNumber,
                    conditionType,
                    surfaces,
                    command.Notes,
                    updatedAt,
                    command.UpdatedBy);
                patient.UpsertToothCondition(condition);
                updatedAt = condition.UpdatedAt;
            }

            if (await patients.UpdateOdontogramAsync(patient, cancellationToken))
            {
                return Result<ToothConditionDto>.Success(new ToothConditionDto(
                    command.ToothNumber,
                    conditionType.ToToken(),
                    surfaces.Select(surface => surface.ToToken()).ToArray(),
                    command.Notes ?? string.Empty,
                    updatedAt,
                    command.UpdatedBy));
            }

            if (attempt == maxAttempts)
            {
                return Result<ToothConditionDto>.Failure("patient.not_found", "Không tìm thấy bệnh nhân hoặc xảy ra xung đột cập nhật.");
            }
        }

        return Result<ToothConditionDto>.Failure("patient.not_found", "Không tìm thấy bệnh nhân.");
    }
}

public sealed class UpdateToothConditionValidator : AbstractValidator<UpdateToothConditionCommand>
{
    public UpdateToothConditionValidator()
    {
        RuleFor(x => x.ClinicId)
            .NotEmpty().WithMessage("Chưa chọn phòng khám.");
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("Chưa chọn bệnh nhân.");
        RuleFor(x => x.ToothNumber)
            .Must(ToothCondition.IsValidToothNumber)
            .WithMessage("Mã răng không hợp lệ theo chuẩn FDI (11-48 răng vĩnh viễn, 51-85 răng sữa).");
        RuleFor(x => x.Condition)
            .NotEmpty().WithMessage("Tình trạng răng là bắt buộc.")
            .Must(token => ToothConditionTypeExtensions.TryParse(token, out _))
            .WithMessage("Tình trạng răng không hợp lệ (healthy, caries, filled, extracted, crown, root_canal).");
        RuleFor(x => x.Surfaces)
            .Must(surfaces => ToothSurfaceExtensions.TryParseAll(surfaces, out _))
            .WithMessage("Mặt răng không hợp lệ. Chỉ chấp nhận M, D, O, B, L.");
        RuleFor(x => x.Notes).MaximumLength(500);
        RuleFor(x => x.UpdatedBy).MaximumLength(100);
    }
}
