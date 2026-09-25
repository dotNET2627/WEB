using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Identity.Commands.SwitchClinic;

public sealed class SwitchClinicCommandHandler : ICommandHandler<SwitchClinicCommand, Result<SwitchClinicResponseDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly ICurrentUser _currentUser;
    private readonly ITokenService _tokenService;

    public SwitchClinicCommandHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ICurrentUser currentUser,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _currentUser = currentUser;
        _tokenService = tokenService;
    }

    public async Task<Result<SwitchClinicResponseDto>> Handle(SwitchClinicCommand command, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            return Result<SwitchClinicResponseDto>.Failure("auth.unauthorized", "Yêu cầu đăng nhập để thực hiện chuyển phòng khám.");
        }

        var user = await _userRepository.GetByIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null || !user.IsActive)
        {
            return Result<SwitchClinicResponseDto>.Failure("auth.account_disabled", "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
        }

        var assignedClinics = user.GetAssignedClinicIds();
        if (assignedClinics.Count > 0 && !assignedClinics.Contains(command.TargetClinicId))
        {
            return Result<SwitchClinicResponseDto>.Failure(
                "auth.clinic_access_denied",
                "Bạn không có quyền thao tác trên phòng khám này.");
        }

        var roleIds = user.GetRoleIdsForClinic(command.TargetClinicId);
        var roles = await _roleRepository.GetByIdsAsync(roleIds, cancellationToken);
        var roleNames = roles.Select(r => r.Name).Distinct().ToList();
        var permissions = roles.SelectMany(r => r.Permissions).Distinct().ToList();

        var newAccessToken = _tokenService.GenerateAccessToken(user, command.TargetClinicId, roleNames, permissions);

        var response = new SwitchClinicResponseDto(
            newAccessToken,
            ExpiresIn: 15 * 60,
            command.TargetClinicId,
            roleNames,
            permissions);

        return Result<SwitchClinicResponseDto>.Success(response);
    }
}
