using DentalManagement.Domain.Clinics;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class ClinicTests
{
    [Fact]
    public void Clinic_Create_ValidParameters_ShouldSucceed()
    {
        // Arrange
        var id = Guid.NewGuid();
        var name = "Phòng Khám Răng Hàm Mặt Sài Gòn";
        var address = "123 Nguyễn Thị Minh Khai, Q1, TP.HCM";
        var phone = "02839998888";
        var email = "contact@saigondental.vn";
        var openingHours = new Dictionary<string, string>
        {
            ["thu2_thu6"] = "08:00 - 20:00",
            ["thu7_chunhat"] = "08:00 - 17:00"
        };

        // Act
        var clinic = new Clinic(id, name, address, phone, email, "Chuyên khoa Implant", openingHours, "/logo.png");

        // Assert
        Assert.Equal(id, clinic.Id);
        Assert.Equal(name, clinic.Name);
        Assert.Equal(address, clinic.Address);
        Assert.Equal(phone, clinic.PhoneNumber);
        Assert.Equal(email, clinic.Email);
        Assert.True(clinic.IsActive);
        Assert.NotNull(clinic.OpeningHours);
        Assert.Equal("08:00 - 20:00", clinic.OpeningHours["thu2_thu6"]);
    }

    [Theory]
    [InlineData("", "123 Address")]
    [InlineData("   ", "123 Address")]
    [InlineData("Name", "")]
    [InlineData("Name", "   ")]
    public void Clinic_Create_InvalidNameOrAddress_ShouldThrowArgumentException(string name, string address)
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            new Clinic(Guid.NewGuid(), name, address));
    }

    [Fact]
    public void Clinic_UpdateDetails_ShouldModifyPropertiesAndTouch()
    {
        // Arrange
        var clinic = new Clinic(Guid.NewGuid(), "Phòng Khám Cũ", "Địa Chỉ Cũ");
        var initialUpdatedAt = clinic.UpdatedAt;

        // Act
        clinic.UpdateDetails(
            "Phòng Khám Mới",
            "Địa Chỉ Mới",
            "0909123456",
            "new@clinic.vn",
            "Mô tả mới",
            null,
            "/new-logo.png");

        // Assert
        Assert.Equal("Phòng Khám Mới", clinic.Name);
        Assert.Equal("Địa Chỉ Mới", clinic.Address);
        Assert.Equal("0909123456", clinic.PhoneNumber);
        Assert.Equal("new@clinic.vn", clinic.Email);
        Assert.True(clinic.UpdatedAt >= initialUpdatedAt);
    }

    [Fact]
    public void Clinic_DeactivateAndActivate_ShouldChangeStatus()
    {
        // Arrange
        var clinic = new Clinic(Guid.NewGuid(), "Phòng Khám A", "123 Đường A");
        Assert.True(clinic.IsActive);

        // Act - Deactivate
        clinic.Deactivate();
        Assert.False(clinic.IsActive);

        // Act - Activate
        clinic.Activate();
        Assert.True(clinic.IsActive);
    }
}
