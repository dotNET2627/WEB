using FluentValidation;

namespace DentalManagement.Application.Identity.Commands.RefreshToken;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RawRefreshToken)
            .NotEmpty().WithMessage("Refresh token không được để trống.");
    }
}
