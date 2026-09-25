using DentalManagement.Api.Endpoints;
using FluentValidation;

namespace DentalManagement.Api.Validators;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");
    }
}

public sealed class SwitchClinicRequestValidator : AbstractValidator<SwitchClinicRequest>
{
    public SwitchClinicRequestValidator()
    {
        RuleFor(x => x.TargetClinicId)
            .NotEmpty().WithMessage("Mã phòng khám đích không được để trống.");
    }
}
