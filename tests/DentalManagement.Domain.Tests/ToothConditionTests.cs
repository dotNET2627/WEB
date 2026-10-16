using DentalManagement.Domain.Patients;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class ToothConditionTests
{
    [Theory]
    // Permanent teeth: quadrants 1-4, units 1-8.
    [InlineData(11)]
    [InlineData(18)]
    [InlineData(21)]
    [InlineData(28)]
    [InlineData(31)]
    [InlineData(38)]
    [InlineData(41)]
    [InlineData(48)]
    // Primary teeth: quadrants 5-8, units 1-5.
    [InlineData(51)]
    [InlineData(55)]
    [InlineData(61)]
    [InlineData(65)]
    [InlineData(71)]
    [InlineData(75)]
    [InlineData(81)]
    [InlineData(85)]
    public void ToothCondition_IsValidToothNumber_FdiNumbers_ShouldBeValid(int toothNumber)
    {
        Assert.True(ToothCondition.IsValidToothNumber(toothNumber));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-11)]
    [InlineData(10)]
    [InlineData(19)] // 19 is not a FDI number (units only 1-8).
    [InlineData(20)]
    [InlineData(49)]
    [InlineData(50)] // Primary quadrant but unit 0.
    [InlineData(56)] // Primary quadrants only allow units 1-5.
    [InlineData(86)]
    [InlineData(91)]
    [InlineData(99)]
    public void ToothCondition_IsValidToothNumber_InvalidNumbers_ShouldBeInvalid(int toothNumber)
    {
        Assert.False(ToothCondition.IsValidToothNumber(toothNumber));
    }

    [Fact]
    public void ToothCondition_Constructor_InvalidToothNumber_ShouldThrow()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new ToothCondition(19, ToothConditionType.Caries, [], "note", DateTimeOffset.UtcNow));
    }

    [Fact]
    public void ToothCondition_Constructor_ShouldNormalizeSurfacesAndNote()
    {
        var now = DateTimeOffset.UtcNow;

        var tooth = new ToothCondition(
            16,
            ToothConditionType.Caries,
            [ToothSurface.O, ToothSurface.M, ToothSurface.O], // duplicate removed
            "  Sâu ngà nông  ",
            now,
            "  bs-001  ");

        Assert.Equal(16, tooth.ToothNumber);
        Assert.Equal(ToothConditionType.Caries, tooth.Condition);
        Assert.Equal([ToothSurface.O, ToothSurface.M], tooth.Surfaces);
        Assert.Equal("Sâu ngà nông", tooth.Note);
        Assert.Equal(now, tooth.UpdatedAt);
        Assert.Equal("bs-001", tooth.UpdatedBy);
    }

    [Theory]
    [InlineData(ToothConditionType.Healthy, "healthy")]
    [InlineData(ToothConditionType.Caries, "caries")]
    [InlineData(ToothConditionType.Filled, "filled")]
    [InlineData(ToothConditionType.Extracted, "extracted")]
    [InlineData(ToothConditionType.Crown, "crown")]
    [InlineData(ToothConditionType.RootCanon, "root_canal")]
    public void ToothConditionType_ToToken_ShouldReturnSnakeCaseToken(
        ToothConditionType condition, string token)
    {
        Assert.Equal(token, condition.ToToken());
    }

    [Theory]
    [InlineData("healthy", ToothConditionType.Healthy)]
    [InlineData("Caries", ToothConditionType.Caries)]
    [InlineData("FILLED", ToothConditionType.Filled)]
    [InlineData("extracted", ToothConditionType.Extracted)]
    [InlineData("crown", ToothConditionType.Crown)]
    [InlineData("root_canal", ToothConditionType.RootCanon)]
    [InlineData("root-canal", ToothConditionType.RootCanon)]
    [InlineData(" rootcanal ", ToothConditionType.RootCanon)]
    public void ToothConditionType_TryParse_ShouldAcceptTokens(string token, ToothConditionType expected)
    {
        Assert.True(ToothConditionTypeExtensions.TryParse(token, out var parsed));
        Assert.Equal(expected, parsed);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    [InlineData("bridge")]
    [InlineData("implant")]
    [InlineData("nonsense")]
    public void ToothConditionType_TryParse_UnknownTokens_ShouldFail(string? token)
    {
        Assert.False(ToothConditionTypeExtensions.TryParse(token, out _));
    }

    [Theory]
    [InlineData("M", ToothSurface.M)]
    [InlineData("d", ToothSurface.D)]
    [InlineData(" O ", ToothSurface.O)]
    [InlineData("b", ToothSurface.B)]
    [InlineData("L", ToothSurface.L)]
    public void ToothSurface_TryParse_ShouldAcceptSingleLetterTokens(string token, ToothSurface expected)
    {
        Assert.True(ToothSurfaceExtensions.TryParse(token, out var parsed));
        Assert.Equal(expected, parsed);
    }

    [Fact]
    public void ToothSurface_TryParse_InvalidToken_ShouldFail()
    {
        Assert.False(ToothSurfaceExtensions.TryParse("X", out _));
        Assert.False(ToothSurfaceExtensions.TryParse(null, out _));
    }

    [Fact]
    public void ToothSurface_TryParseAll_ValidTokens_ShouldReturnDistinctSurfaces()
    {
        Assert.True(ToothSurfaceExtensions.TryParseAll(["O", "M", "o", "D"], out var surfaces));
        Assert.Equal([ToothSurface.O, ToothSurface.M, ToothSurface.D], surfaces);
    }

    [Fact]
    public void ToothSurface_TryParseAll_InvalidToken_ShouldFail()
    {
        Assert.False(ToothSurfaceExtensions.TryParseAll(["O", "X"], out var surfaces));
        Assert.Empty(surfaces);
    }

    [Fact]
    public void ToothSurface_TryParseAll_NullTokens_ShouldSucceedWithEmptyList()
    {
        Assert.True(ToothSurfaceExtensions.TryParseAll(null, out var surfaces));
        Assert.Empty(surfaces);
    }
}
