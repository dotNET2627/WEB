using FluentValidation;

namespace DentalManagement.Application.Identity.Commands.SwitchClinic;

public sealed class SwitchClinicCommandValidator : AbstractValidator<SwitchClinicCommand>
{
    public SwitchClinicCommandValidator()
    {
        RuleFor(x => x.TargetClinicId)
            .NotEmpty().WithMessage("ID phòng khám đích không được để trống.");
    }
}
