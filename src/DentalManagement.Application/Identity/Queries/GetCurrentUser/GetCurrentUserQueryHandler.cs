using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Identity.Queries.GetCurrentUser;

public sealed class GetCurrentUserQueryHandler : IQueryHandler<GetCurrentUserQuery, Result<CurrentUserDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly ICurrentUser _currentUser;

    public GetCurrentUserQueryHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ICurrentUser currentUser)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _currentUser = currentUser;
    }

    public async Task<Result<CurrentUserDto>> Handle(GetCurrentUserQuery query, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            return Result<CurrentUserDto>.Failure("auth.unauthorized", "Yêu cầu đăng nhập.");
        }

        var user = await _userRepository.GetByIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null || !user.IsActive)
        {
            return Result<CurrentUserDto>.Failure("auth.account_disabled", "Tài khoản không tồn tại hoặc đã bị khóa.");
        }

        var assignedClinics = user.GetAssignedClinicIds();
        Guid? activeClinicId = _currentUser.ClinicId
            ?? user.DefaultClinicId
            ?? (assignedClinics.Count > 0 ? assignedClinics[0] : null);

        var roleNames = _currentUser.Roles.Count > 0
            ? _currentUser.Roles
            : new List<string>();

        var permissions = _currentUser.Permissions.Count > 0
            ? _currentUser.Permissions
            : new List<string>();

        if (roleNames.Count == 0 && activeClinicId.HasValue && activeClinicId.Value != Guid.Empty)
        {
            var roleIds = user.GetRoleIdsForClinic(activeClinicId.Value);
            var roles = await _roleRepository.GetByIdsAsync(roleIds, cancellationToken);
            roleNames = roles.Select(r => r.Name).Distinct().ToList();
            permissions = roles.SelectMany(r => r.Permissions).Distinct().ToList();
        }

        var dto = new CurrentUserDto(
            user.Id,
            user.Email,
            user.FullName,
            activeClinicId,
            roleNames,
            permissions,
            user.GetAssignedClinicIds());

        return Result<CurrentUserDto>.Success(dto);
    }
}
