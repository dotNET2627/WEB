using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Identity.Commands.RevokeToken;

public sealed class RevokeTokenCommandHandler : ICommandHandler<RevokeTokenCommand, Result>
{
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ITokenService _tokenService;
    private readonly IClock _clock;

    public RevokeTokenCommandHandler(
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService,
        IClock clock)
    {
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
        _clock = clock;
    }

    public async Task<Result> Handle(RevokeTokenCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RawRefreshToken))
        {
            return Result.Success();
        }

        var tokenHash = _tokenService.HashRefreshToken(command.RawRefreshToken);
        var token = await _refreshTokenRepository.GetByHashAsync(tokenHash, cancellationToken);

        if (token is not null && !token.IsRevoked)
        {
            token.Revoke(_clock.UtcNow);
            await _refreshTokenRepository.UpdateAsync(token, cancellationToken);
        }

        return Result.Success();
    }
}
