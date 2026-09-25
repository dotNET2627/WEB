using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Identity;

namespace DentalManagement.Application.Identity.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler : ICommandHandler<RefreshTokenCommand, Result<RefreshTokenResponseDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ITokenService _tokenService;
    private readonly IClock _clock;

    public RefreshTokenCommandHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService,
        IClock clock)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
        _clock = clock;
    }

    public async Task<Result<RefreshTokenResponseDto>> Handle(RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var tokenHash = _tokenService.HashRefreshToken(command.RawRefreshToken);
        var existingToken = await _refreshTokenRepository.GetByHashAsync(tokenHash, cancellationToken);

        if (existingToken is null)
        {
            return Result<RefreshTokenResponseDto>.Failure("auth.invalid_token", "Phiên đăng nhập không hợp lệ.");
        }

        // RFC 6819: Token Reuse Detection
        if (existingToken.IsRevoked)
        {
            // Revoke all tokens for this user immediately
            await _refreshTokenRepository.RevokeAllForUserAsync(existingToken.UserId, cancellationToken);

            return Result<RefreshTokenResponseDto>.Failure(
                "auth.token_reuse_detected",
                "Phát hiện truy cập bất thường (Token Reuse). Toàn bộ phiên làm việc của bạn đã bị thu hồi để đảm bảo an toàn. Vui lòng đăng nhập lại.");
        }

        if (existingToken.IsExpired(now))
        {
            return Result<RefreshTokenResponseDto>.Failure("auth.token_expired", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        var user = await _userRepository.GetByIdAsync(existingToken.UserId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            return Result<RefreshTokenResponseDto>.Failure("auth.account_disabled", "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
        }

        // Token Rotation: Generate new token and mark old as revoked
        var (newRawToken, newTokenHash, newExpiresAt) = _tokenService.GenerateRefreshToken(rememberMe: true, now);

        existingToken.Revoke(now, replacedByTokenHash: newTokenHash);
        await _refreshTokenRepository.UpdateAsync(existingToken, cancellationToken);

        var newToken = new Domain.Identity.RefreshToken(
            Guid.NewGuid(),
            newTokenHash,
            user.Id,
            newExpiresAt,
            now,
            command.IpAddress,
            command.UserAgent);

        await _refreshTokenRepository.AddAsync(newToken, cancellationToken);

        // Resolve roles and permissions
        var activeClinicId = user.DefaultClinicId ?? user.GetAssignedClinicIds().FirstOrDefault();
        var roleIds = user.GetRoleIdsForClinic(activeClinicId);
        var roles = await _roleRepository.GetByIdsAsync(roleIds, cancellationToken);
        var roleNames = roles.Select(r => r.Name).Distinct().ToList();
        var permissions = roles.SelectMany(r => r.Permissions).Distinct().ToList();

        var newAccessToken = _tokenService.GenerateAccessToken(user, activeClinicId, roleNames, permissions);

        var response = new RefreshTokenResponseDto(
            newAccessToken,
            ExpiresIn: 15 * 60,
            newRawToken,
            newExpiresAt);

        return Result<RefreshTokenResponseDto>.Success(response);
    }
}
