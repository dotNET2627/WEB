using DentalManagement.Domain.Doctors;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class DoctorTests
{
    [Fact]
    public void Doctor_Create_ValidParameters_ShouldSucceed()
    {
        // Arrange
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var clinicId = Guid.NewGuid();
        var license = "CCHN-00982-BYT";
        var specialty = "Nha Chu & Cấy Ghép Implant";

        // Act
        var doctor = new Doctor(
            id,
            userId,
            license,
            clinicId,
            yearsOfExperience: 10,
            specialty: specialty,
            biography: "10 năm kinh nghiệm phẫu thuật.");

        // Assert
        Assert.Equal(id, doctor.Id);
        Assert.Equal(userId, doctor.UserId);
        Assert.Equal(clinicId, doctor.ClinicId);
        Assert.Equal(license, doctor.MedicalLicenseNumber);
        Assert.Equal(specialty, doctor.Specialty);
        Assert.Equal(10, doctor.YearsOfExperience);
        Assert.Empty(doctor.WorkSchedules);
    }

    [Fact]
    public void Doctor_Create_EmptyUserId_ShouldThrowArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            new Doctor(Guid.NewGuid(), Guid.Empty, "CCHN-12345"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Doctor_Create_InvalidLicense_ShouldThrowArgumentException(string license)
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            new Doctor(Guid.NewGuid(), Guid.NewGuid(), license));
    }

    [Fact]
    public void Doctor_UpdateProfile_ShouldUpdateFieldsAndTouch()
    {
        // Arrange
        var doctor = new Doctor(Guid.NewGuid(), Guid.NewGuid(), "CCHN-OLD", null, 2, "Tổng quát", "Mô tả cũ");
        var initialUpdatedAt = doctor.UpdatedAt;
        var newClinicId = Guid.NewGuid();

        // Act
        doctor.UpdateProfile("CCHN-NEW", "Chỉnh nha", 5, "Mô tả mới", newClinicId);

        // Assert
        Assert.Equal("CCHN-NEW", doctor.MedicalLicenseNumber);
        Assert.Equal("Chỉnh nha", doctor.Specialty);
        Assert.Equal(5, doctor.YearsOfExperience);
        Assert.Equal("Mô tả mới", doctor.Biography);
        Assert.Equal(newClinicId, doctor.ClinicId);
        Assert.True(doctor.UpdatedAt >= initialUpdatedAt);
    }

    [Fact]
    public void Doctor_SetWorkSchedules_ShouldReplaceSchedules()
    {
        // Arrange
        var clinicId = Guid.NewGuid();
        var doctor = new Doctor(Guid.NewGuid(), Guid.NewGuid(), "CCHN-123", clinicId);

        var schedules = new List<WorkScheduleItem>
        {
            WorkScheduleItem.Create(clinicId, 2, "08:00", "12:00", true),
            WorkScheduleItem.Create(clinicId, 2, "13:00", "17:00", true),
            WorkScheduleItem.Create(clinicId, 4, "08:00", "17:00", true)
        };

        // Act
        doctor.SetWorkSchedules(schedules);

        // Assert
        Assert.Equal(3, doctor.WorkSchedules.Count);
        Assert.Contains(doctor.WorkSchedules, s => s.DayOfWeek == 2 && s.StartTime == "08:00");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(8)]
    public void WorkScheduleItem_InvalidDayOfWeek_ShouldThrowArgumentOutOfRangeException(int dayOfWeek)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            WorkScheduleItem.Create(Guid.NewGuid(), dayOfWeek, "08:00", "17:00"));
    }

    [Theory]
    [InlineData("17:00", "08:00")]
    [InlineData("12:00", "12:00")]
    public void WorkScheduleItem_EndTimeBeforeOrEqualToStartTime_ShouldThrowArgumentException(string start, string end)
    {
        Assert.Throws<ArgumentException>(() =>
            WorkScheduleItem.Create(Guid.NewGuid(), 2, start, end));
    }

    [Fact]
    public void WorkScheduleItem_OverlapsWith_ShouldDetectConflictOnSameDay()
    {
        // Arrange
        var scheduleA = WorkScheduleItem.Create(Guid.NewGuid(), 2, "08:00", "12:00", true);
        var overlap1 = WorkScheduleItem.Create(Guid.NewGuid(), 2, "10:00", "14:00", true);
        var overlap2 = WorkScheduleItem.Create(Guid.NewGuid(), 2, "07:00", "09:00", true);
        var overlap3 = WorkScheduleItem.Create(Guid.NewGuid(), 2, "08:30", "11:30", true);
        var noOverlapSameDay = WorkScheduleItem.Create(Guid.NewGuid(), 2, "12:00", "17:00", true);
        var noOverlapDiffDay = WorkScheduleItem.Create(Guid.NewGuid(), 3, "08:00", "12:00", true);

        // Assert
        Assert.True(scheduleA.OverlapsWith(overlap1));
        Assert.True(scheduleA.OverlapsWith(overlap2));
        Assert.True(scheduleA.OverlapsWith(overlap3));
        Assert.False(scheduleA.OverlapsWith(noOverlapSameDay));
        Assert.False(scheduleA.OverlapsWith(noOverlapDiffDay));
    }

    [Fact]
    public void Doctor_AddWorkSchedule_Conflict_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var doctor = new Doctor(Guid.NewGuid(), Guid.NewGuid(), "CCHN-123");
        var schedule1 = WorkScheduleItem.Create(null, 2, "08:00", "12:00", true);
        var conflictingSchedule = WorkScheduleItem.Create(null, 2, "11:00", "15:00", true);

        // Act
        doctor.AddWorkSchedule(schedule1);

        // Assert
        Assert.Throws<InvalidOperationException>(() => doctor.AddWorkSchedule(conflictingSchedule));
    }

    [Fact]
    public void Doctor_RemoveWorkSchedule_ShouldRemoveCorrectly()
    {
        // Arrange
        var doctor = new Doctor(Guid.NewGuid(), Guid.NewGuid(), "CCHN-123");
        var scheduleId = Guid.NewGuid();
        var schedule = WorkScheduleItem.Create(scheduleId, null, 3, "08:00", "12:00", true);
        doctor.AddWorkSchedule(schedule);
        Assert.Single(doctor.WorkSchedules);

        // Act
        var removed = doctor.RemoveWorkSchedule(scheduleId);

        // Assert
        Assert.True(removed);
        Assert.Empty(doctor.WorkSchedules);
    }

    [Fact]
    public void Doctor_SetWorkSchedules_InternalConflict_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var doctor = new Doctor(Guid.NewGuid(), Guid.NewGuid(), "CCHN-123");
        var schedules = new List<WorkScheduleItem>
        {
            WorkScheduleItem.Create(null, 2, "08:00", "12:00", true),
            WorkScheduleItem.Create(null, 2, "10:00", "14:00", true)
        };

        // Assert
        Assert.Throws<InvalidOperationException>(() => doctor.SetWorkSchedules(schedules));
    }
}
