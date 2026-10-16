using DentalManagement.Domain.Patients;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class PatientMedicalHistoryTests
{
    private static Patient CreatePatient() => new(Guid.NewGuid(), Guid.NewGuid(), "Nguyễn Văn An", "BN001");

    private static MedicalHistoryItem Item(string type = "allergy", string name = "Dị ứng Penicillin") =>
        new(type, name, "severe", "Gây sốc phản vệ", DateTimeOffset.UtcNow);

    [Fact]
    public void Patient_AddMedicalHistory_ShouldAppendItemAndTouchUpdatedAt()
    {
        var patient = CreatePatient();
        var initialUpdatedAt = patient.UpdatedAt;

        patient.AddMedicalHistory(Item());

        var item = Assert.Single(patient.MedicalHistory);
        Assert.Equal("allergy", item.Type);
        Assert.Equal("Dị ứng Penicillin", item.Name);
        Assert.Equal("severe", item.Severity);
        Assert.Equal("Gây sốc phản vệ", item.Note);
        Assert.True(patient.UpdatedAt >= initialUpdatedAt);
    }

    [Fact]
    public void Patient_AddMedicalHistory_NullItem_ShouldThrow()
    {
        var patient = CreatePatient();
        Assert.Throws<ArgumentNullException>(() => patient.AddMedicalHistory(null!));
    }

    [Fact]
    public void Patient_AddMultipleHistory_ShouldKeepInsertionOrder()
    {
        var patient = CreatePatient();
        patient.AddMedicalHistory(Item("allergy", "Dị ứng Penicillin"));
        patient.AddMedicalHistory(Item("chronic", "Cao huyết áp"));
        patient.AddMedicalHistory(Item("medication", "Thuốc chống đông"));

        Assert.Equal(
            ["allergy", "chronic", "medication"],
            patient.MedicalHistory.Select(item => item.Type).ToArray());
    }

    [Fact]
    public void Patient_UpdateMedicalHistory_ShouldReplaceItemAtIndex()
    {
        var patient = CreatePatient();
        patient.AddMedicalHistory(Item("allergy", "Dị ứng Penicillin"));
        patient.AddMedicalHistory(Item("chronic", "Cao huyết áp"));

        patient.UpdateMedicalHistory(1, Item("chronic", "Tiểu đường"));

        Assert.Equal(2, patient.MedicalHistory.Count);
        Assert.Equal("Dị ứng Penicillin", patient.MedicalHistory.First().Name);
        Assert.Equal("Tiểu đường", patient.MedicalHistory.Last().Name);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(2)]
    public void Patient_UpdateMedicalHistory_IndexOutOfRange_ShouldThrow(int index)
    {
        var patient = CreatePatient();
        patient.AddMedicalHistory(Item());
        patient.AddMedicalHistory(Item("chronic", "Cao huyết áp"));

        Assert.Throws<ArgumentOutOfRangeException>(() => patient.UpdateMedicalHistory(index, Item()));
    }

    [Fact]
    public void Patient_RemoveMedicalHistory_ShouldRemoveItemAtIndex()
    {
        var patient = CreatePatient();
        patient.AddMedicalHistory(Item("allergy", "Dị ứng Penicillin"));
        patient.AddMedicalHistory(Item("chronic", "Cao huyết áp"));
        patient.AddMedicalHistory(Item("medication", "Thuốc chống đông"));

        patient.RemoveMedicalHistory(0);

        Assert.Equal(2, patient.MedicalHistory.Count);
        Assert.Equal(["chronic", "medication"], patient.MedicalHistory.Select(item => item.Type).ToArray());
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(1)]
    public void Patient_RemoveMedicalHistory_IndexOutOfRange_ShouldThrow(int index)
    {
        var patient = CreatePatient();
        patient.AddMedicalHistory(Item());

        Assert.Throws<ArgumentOutOfRangeException>(() => patient.RemoveMedicalHistory(index));
    }

    [Fact]
    public void Patient_RemoveMedicalHistory_EmptyHistory_ShouldThrow()
    {
        var patient = CreatePatient();

        Assert.Throws<ArgumentOutOfRangeException>(() => patient.RemoveMedicalHistory(0));
        Assert.Empty(patient.MedicalHistory);
    }
}

public class PatientOdontogramTests
{
    private static Patient CreatePatient() => new(Guid.NewGuid(), Guid.NewGuid(), "Trần Thị Bé", "BN002");

    private static ToothCondition Tooth(int number, ToothConditionType condition = ToothConditionType.Caries) =>
        new(number, condition, [ToothSurface.O], "Ghi chú", DateTimeOffset.UtcNow, "bs-001");

    [Fact]
    public void Patient_Teeth_ShouldBeEmptyByDefault()
    {
        Assert.Empty(CreatePatient().Teeth);
    }

    [Fact]
    public void Patient_UpsertToothCondition_ShouldAddNewTooth()
    {
        var patient = CreatePatient();

        patient.UpsertToothCondition(Tooth(16));

        var tooth = patient.GetTooth(16)!;
        Assert.NotNull(tooth);
        Assert.Equal(16, tooth.ToothNumber);
        Assert.Equal(ToothConditionType.Caries, tooth.Condition);
    }

    [Fact]
    public void Patient_UpsertToothCondition_SameToothTwice_ShouldReplaceRecord()
    {
        var patient = CreatePatient();
        patient.UpsertToothCondition(Tooth(16, ToothConditionType.Caries));

        patient.UpsertToothCondition(Tooth(16, ToothConditionType.Crown));

        Assert.Single(patient.Teeth);
        Assert.Equal(ToothConditionType.Crown, patient.GetTooth(16)!.Condition);
    }

    [Fact]
    public void Patient_UpsertToothCondition_InvalidToothNumber_ShouldThrow()
    {
        var patient = CreatePatient();

        Assert.Throws<ArgumentOutOfRangeException>(() => patient.UpsertToothCondition(Tooth(19)));
        Assert.Empty(patient.Teeth);
    }

    [Fact]
    public void Patient_RemoveToothCondition_ShouldReturnTrueWhenRecordExisted()
    {
        var patient = CreatePatient();
        patient.UpsertToothCondition(Tooth(48, ToothConditionType.Extracted));

        Assert.True(patient.RemoveToothCondition(48));
        Assert.Empty(patient.Teeth);
        Assert.Null(patient.GetTooth(48));
    }

    [Fact]
    public void Patient_RemoveToothCondition_MissingTooth_ShouldReturnFalse()
    {
        var patient = CreatePatient();

        Assert.False(patient.RemoveToothCondition(36));
    }

    [Fact]
    public void Patient_UpsertToothCondition_ShouldTouchUpdatedAt()
    {
        var patient = CreatePatient();
        var initialUpdatedAt = patient.UpdatedAt;

        patient.UpsertToothCondition(Tooth(26));

        Assert.True(patient.UpdatedAt >= initialUpdatedAt);
    }
}
