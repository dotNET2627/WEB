using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Identity;

namespace DentalManagement.Application.Identity.Commands.Login;

public sealed class LoginCommandHandler : ICommandHandler<LoginCommand, Result<LoginResponseDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IClock _clock;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IClock clock)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _clock = clock;
    }

    public async Task<Result<LoginResponseDto>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var user = await _userRepository.GetByEmailAsync(command.Email, cancellationToken);

        if (user is null)
        {
            // Timing-safe dummy check against user enumeration
            _passwordHasher.PerformDummyVerification();
            return Result<LoginResponseDto>.Failure("auth.invalid_credentials", "Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (!user.IsActive)
        {
            return Result<LoginResponseDto>.Failure("auth.account_disabled", "Tài khoản đã bị vô hiệu hóa.");
        }

        if (user.IsLockedOut(now))
        {
            var remainingMinutes = (int)Math.Max(1, Math.Ceiling((user.LockoutEnd!.Value - now).TotalMinutes));
            return Result<LoginResponseDto>.Failure(
                "auth.account_locked",
                $"Tài khoản đang bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau {remainingMinutes} phút.");
        }

        if (!_passwordHasher.Verify(command.Password, user.PasswordHash))
        {
            user.RecordFailedLogin(now, maxFailedAttempts: 5, lockoutMinutes: 15);
            await _userRepository.UpdateAsync(user, cancellationToken);

            if (user.IsLockedOut(now))
            {
                return Result<LoginResponseDto>.Failure(
                    "auth.account_locked",
                    "Nhập sai quá 5 lần. Tài khoản đã bị tạm khóa 15 phút.");
            }

            return Result<LoginResponseDto>.Failure("auth.invalid_credentials", "Tài khoản hoặc mật khẩu không chính xác.");
        }

        // Login success
        user.RecordSuccessfulLogin();
        await _userRepository.UpdateAsync(user, cancellationToken);

        // Determine Active Clinic
        var assignedClinics = user.GetAssignedClinicIds();
        Guid activeClinicId;

        if (command.ClinicId.HasValue)
        {
            if (assignedClinics.Count > 0 && !assignedClinics.Contains(command.ClinicId.Value))
            {
                return Result<LoginResponseDto>.Failure("auth.clinic_access_denied", "Bạn không có quyền truy cập vào phòng khám này.");
            }
            activeClinicId = command.ClinicId.Value;
        }
        else
        {
            activeClinicId = user.DefaultClinicId ?? assignedClinics.FirstOrDefault();
        }

        // Resolve roles and dynamic permissions for this clinic
        var roleIds = user.GetRoleIdsForClinic(activeClinicId);
        var roles = await _roleRepository.GetByIdsAsync(roleIds, cancellationToken);
        var roleNames = roles.Select(r => r.Name).Distinct().ToList();
        var permissions = roles.SelectMany(r => r.Permissions).Distinct().ToList();

        // Issue tokens
        var accessToken = _tokenService.GenerateAccessToken(user, activeClinicId, roleNames, permissions);
        var (rawRefreshToken, tokenHash, refreshTokenExpiresAt) = _tokenService.GenerateRefreshToken(command.RememberMe, now);

        var refreshToken = new Domain.Identity.RefreshToken(
            Guid.NewGuid(),
            tokenHash,
            user.Id,
            refreshTokenExpiresAt,
            now,
            command.IpAddress,
            command.UserAgent);

        await _refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

        var userSummary = new UserSummaryDto(
            user.Id,
            user.Email,
            user.FullName,
            activeClinicId,
            roleNames,
            permissions,
            assignedClinics);

        var response = new LoginResponseDto(
            accessToken,
            ExpiresIn: 15 * 60, // 15 minutes
            rawRefreshToken,
            refreshTokenExpiresAt,
            command.RememberMe,
            userSummary);

        return Result<LoginResponseDto>.Success(response);
    }
}
