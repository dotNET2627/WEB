using DentalManagement.Application.Patients;
using DentalManagement.Application.Patients.Odontogram;
using DentalManagement.Application.Tests.Fakes;
using DentalManagement.Domain.Patients;
using FluentValidation;
using Xunit;

namespace DentalManagement.Application.Tests.Patients;

public class UpdateToothConditionValidatorTests
{
    private readonly UpdateToothConditionValidator _validator = new();

    private static UpdateToothConditionCommand Command(
        int toothNumber = 16,
        string? condition = "caries",
        IReadOnlyList<string>? surfaces = null,
        string? notes = null) =>
        new(Guid.NewGuid(), Guid.NewGuid(), toothNumber, condition, surfaces ?? ["O"], notes, "bs-001");

    [Fact]
    public void Validator_ValidCommand_ShouldPass()
    {
        var result = _validator.Validate(Command());

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validator_ValidPrimaryTooth_ShouldPass()
    {
        var result = _validator.Validate(Command(toothNumber: 51, condition: "root_canal"));

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(10)]
    [InlineData(19)]
    [InlineData(49)]
    [InlineData(50)]
    [InlineData(56)]
    [InlineData(86)]
    public void Validator_InvalidFdiToothNumber_ShouldFail(int toothNumber)
    {
        var result = _validator.Validate(Command(toothNumber: toothNumber));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.ErrorMessage.Contains("FDI"));
    }

    [Theory]
    [InlineData("bridge")]
    [InlineData("implant")]
    [InlineData("")]
    [InlineData(null)]
    public void Validator_UnknownConditionToken_ShouldFail(string? condition)
    {
        var result = _validator.Validate(Command(condition: condition));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData("healthy")]
    [InlineData("Caries")]
    [InlineData("filled")]
    [InlineData("extracted")]
    [InlineData("crown")]
    [InlineData("root_canal")]
    public void Validator_KnownConditionTokens_ShouldPass(string condition)
    {
        var result = _validator.Validate(Command(condition: condition));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validator_InvalidSurfaceToken_ShouldFail()
    {
        var result = _validator.Validate(Command(surfaces: ["O", "X"]));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.ErrorMessage.Contains("Mặt răng"));
    }

    [Fact]
    public void Validator_ValidSurfaces_ShouldPass()
    {
        var result = _validator.Validate(Command(surfaces: ["O", "M", "D", "B", "L"]));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validator_TooLongNotes_ShouldFail()
    {
        var result = _validator.Validate(Command(notes: new string('n', 501)));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validator_EmptyClinic_ShouldFail()
    {
        var command = new UpdateToothConditionCommand(
            Guid.Empty, Guid.NewGuid(), 16, "caries", ["O"], null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
    }
}

public class UpdateToothConditionHandlerTests
{
    private static readonly Guid ClinicId = Guid.NewGuid();
    private static readonly Guid PatientId = Guid.NewGuid();

    private readonly FakePatientRepository _repository = new();
    private readonly UpdateToothConditionCommandHandler _handler;

    public UpdateToothConditionHandlerTests()
    {
        _handler = new UpdateToothConditionCommandHandler(_repository, new UpdateToothConditionValidator());
    }

    private Patient AddPatient()
    {
        var patient = new Patient(PatientId, ClinicId, "Lê Thị Cúc", "BN003");
        _repository.Patients.Add(patient);
        return patient;
    }

    [Fact]
    public async Task Handle_NewCariesTooth_ShouldUpsertRecord()
    {
        var patient = AddPatient();
        var command = new UpdateToothConditionCommand(
            ClinicId, PatientId, 16, "caries", ["O", "M"], "Sâu ngà nông", "bs-001");

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var dto = result.Value!;
        Assert.Equal(16, dto.ToothNumber);
        Assert.Equal("caries", dto.Condition);
        Assert.Equal(["O", "M"], dto.Surfaces.ToArray());
        Assert.Equal("Sâu ngà nông", dto.Notes);
        Assert.Equal("bs-001", dto.UpdatedBy);

        var tooth = patient.GetTooth(16)!;
        Assert.NotNull(tooth);
        Assert.Equal(ToothConditionType.Caries, tooth.Condition);
    }

    [Fact]
    public async Task Handle_ExistingTooth_ShouldReplaceRecord()
    {
        var patient = AddPatient();
        patient.UpsertToothCondition(new ToothCondition(
            26, ToothConditionType.Caries, [ToothSurface.O], null, DateTimeOffset.UtcNow));

        var result = await _handler.Handle(new UpdateToothConditionCommand(
            ClinicId, PatientId, 26, "crown", ["O", "B"], "Bọc sứ Zirconia"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(patient.Teeth);
        Assert.Equal(ToothConditionType.Crown, patient.GetTooth(26)!.Condition);
    }

    [Fact]
    public async Task Handle_HealthyCondition_ShouldRemoveToothRecord()
    {
        var patient = AddPatient();
        patient.UpsertToothCondition(new ToothCondition(
            48, ToothConditionType.Extracted, [], "Đã nhổ", DateTimeOffset.UtcNow));

        var result = await _handler.Handle(new UpdateToothConditionCommand(
            ClinicId, PatientId, 48, "healthy", [], "Đã hồi phục"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("healthy", result.Value!.Condition);
        Assert.Empty(patient.Teeth);
        Assert.Null(patient.GetTooth(48));
    }

    [Fact]
    public async Task Handle_HealthyConditionForUnknownTooth_ShouldStillSucceed()
    {
        var patient = AddPatient();

        var result = await _handler.Handle(new UpdateToothConditionCommand(
            ClinicId, PatientId, 36, "healthy"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(patient.Teeth);
        Assert.Equal("healthy", result.Value!.Condition);
    }

    [Fact]
    public async Task Handle_UnknownPatient_ShouldReturnNotFound()
    {
        var result = await _handler.Handle(new UpdateToothConditionCommand(
            ClinicId, Guid.NewGuid(), 16, "caries"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task Handle_InvalidToothNumber_ShouldFailValidation()
    {
        AddPatient();

        var result = await _handler.Handle(new UpdateToothConditionCommand(
            ClinicId, PatientId, 19, "caries"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.invalid", result.Error!.Code);
    }

    [Fact]
    public async Task Handle_InvalidConditionToken_ShouldFailValidation()
    {
        AddPatient();

        var result = await _handler.Handle(new UpdateToothConditionCommand(
            ClinicId, PatientId, 16, "bridge"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.invalid", result.Error!.Code);
    }

    [Fact]
    public async Task GetOdontogram_ShouldReturnTeethSortedByToothNumber()
    {
        var patient = AddPatient();
        patient.UpsertToothCondition(new ToothCondition(
            36, ToothConditionType.Caries, [ToothSurface.O], null, DateTimeOffset.UtcNow));
        patient.UpsertToothCondition(new ToothCondition(
            16, ToothConditionType.Filled, [ToothSurface.O], null, DateTimeOffset.UtcNow));

        var handler = new GetOdontogramHandler(_repository);
        var result = await handler.Handle(new GetOdontogramQuery(ClinicId, PatientId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal([16, 36], result.Value!.Select(tooth => tooth.ToothNumber).ToArray());
    }

    [Fact]
    public async Task GetOdontogram_UnknownPatient_ShouldReturnNotFound()
    {
        var handler = new GetOdontogramHandler(_repository);

        var result = await handler.Handle(
            new GetOdontogramQuery(ClinicId, Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.not_found", result.Error!.Code);
    }
}
