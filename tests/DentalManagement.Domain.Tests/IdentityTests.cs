using DentalManagement.Domain.Identity;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class IdentityTests
{
    [Fact]
    public void User_FailedLogin_ShouldLockout_After5Attempts()
    {
        // Arrange
        var user = new User(Guid.NewGuid(), "doctor@clinic.vn", "Dr. Nguyen", "hashed_password");
        var now = DateTimeOffset.UtcNow;

        // Act - Simulate 4 failed attempts
        for (int i = 0; i < 4; i++)
        {
            user.RecordFailedLogin(now);
            Assert.False(user.IsLockedOut(now));
            Assert.Equal(i + 1, user.AccessFailedCount);
        }

        // Act - 5th failed attempt triggers lockout
        user.RecordFailedLogin(now);

        // Assert
        Assert.True(user.IsLockedOut(now));
        Assert.Equal(5, user.AccessFailedCount);
        Assert.NotNull(user.LockoutEnd);
        Assert.True(user.LockoutEnd > now);
    }

    [Fact]
    public void User_SuccessfulLogin_ShouldReset_FailedCountAndLockout()
    {
        // Arrange
        var user = new User(Guid.NewGuid(), "doctor@clinic.vn", "Dr. Nguyen", "hashed_password");
        var now = DateTimeOffset.UtcNow;
        for (int i = 0; i < 5; i++)
        {
            user.RecordFailedLogin(now);
        }
        Assert.True(user.IsLockedOut(now));

        // Act
        user.RecordSuccessfulLogin();

        // Assert
        Assert.False(user.IsLockedOut(now));
        Assert.Equal(0, user.AccessFailedCount);
        Assert.Null(user.LockoutEnd);
    }

    [Fact]
    public void User_MultiClinic_RoleAssignments_ShouldIsolateCorrectly()
    {
        // Arrange
        var user = new User(Guid.NewGuid(), "doctor@clinic.vn", "Dr. Nguyen", "hashed_password");
        var clinicA = Guid.NewGuid();
        var clinicB = Guid.NewGuid();
        var roleDoctorId = Guid.NewGuid();
        var roleManagerId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        // Act
        user.AssignRole(roleDoctorId, clinicA, null, now);
        user.AssignRole(roleManagerId, clinicB, null, now);

        // Assert
        var clinicARoles = user.GetRoleIdsForClinic(clinicA);
        var clinicBRoles = user.GetRoleIdsForClinic(clinicB);

        Assert.Contains(roleDoctorId, clinicARoles);
        Assert.DoesNotContain(roleManagerId, clinicARoles);

        Assert.Contains(roleManagerId, clinicBRoles);
        Assert.DoesNotContain(roleDoctorId, clinicBRoles);

        var assignedClinics = user.GetAssignedClinicIds();
        Assert.Equal(2, assignedClinics.Count);
        Assert.Contains(clinicA, assignedClinics);
        Assert.Contains(clinicB, assignedClinics);
    }

    [Fact]
    public void Role_DynamicPermissions_AddAndRemove_Works()
    {
        // Arrange
        var role = new Role(Guid.NewGuid(), "Doctor", "Medical Doctor", isSystem: false);

        // Act
        role.AddPermission("patients.read");
        role.AddPermission("patients.update");

        // Assert
        Assert.Equal(2, role.Permissions.Count);
        Assert.Contains("patients.read", role.Permissions);

        // Act - Remove
        role.RemovePermission("patients.update");
        Assert.Single(role.Permissions);
        Assert.DoesNotContain("patients.update", role.Permissions);
    }
}
