using DentalManagement.Application.Patients;
using DentalManagement.Domain.Patients;
using DentalManagement.Application.Tests.Fakes;
using Xunit;

namespace DentalManagement.Application.Tests.Patients;

public class PatientServiceMedicalHistoryTests
{
    private static readonly Guid ClinicId = Guid.NewGuid();
    private static readonly Guid PatientId = Guid.NewGuid();

    private readonly FakePatientRepository _repository = new();
    private readonly PatientService _service;

    public PatientServiceMedicalHistoryTests()
    {
        _service = new PatientService(
            _repository,
            new CreatePatientValidator(),
            new AddMedicalHistoryValidator());
    }

    private Patient AddPatient()
    {
        var patient = new Patient(PatientId, ClinicId, "Nguyễn Văn An", "BN001");
        _repository.Patients.Add(patient);
        return patient;
    }

    [Fact]
    public async Task AddMedicalHistory_ValidCommand_ShouldAppendAndReturnDto()
    {
        AddPatient();
        var command = new AddMedicalHistoryCommand(
            ClinicId, PatientId, "Allergy", "Dị ứng Penicillin", "Severe", "  Gây sốc phản vệ  ");

        var result = await _service.AddMedicalHistoryAsync(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var dto = result.Value!;
        Assert.Equal("0", dto.Id);
        Assert.Equal("allergy", dto.Type);          // tokens are normalized to lower-case
        Assert.Equal("Dị ứng Penicillin", dto.Name);
        Assert.Equal("severe", dto.Severity);
        Assert.Equal("Gây sốc phản vệ", dto.Notes);
        var item = Assert.Single(_repository.Patients.Single().MedicalHistory);
        Assert.Equal("allergy", item.Type);
    }

    [Fact]
    public async Task AddMedicalHistory_EmptyType_ShouldFailValidation()
    {
        AddPatient();
        var command = new AddMedicalHistoryCommand(ClinicId, PatientId, "   ", "Cao huyết áp");

        var result = await _service.AddMedicalHistoryAsync(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.invalid", result.Error!.Code);
        Assert.Empty(_repository.Patients.Single().MedicalHistory);
    }

    [Fact]
    public async Task AddMedicalHistory_EmptyName_ShouldFailValidation()
    {
        AddPatient();
        var command = new AddMedicalHistoryCommand(ClinicId, PatientId, "chronic", "");

        var result = await _service.AddMedicalHistoryAsync(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.invalid", result.Error!.Code);
    }

    [Fact]
    public async Task AddMedicalHistory_UnknownPatient_ShouldReturnNotFound()
    {
        var command = new AddMedicalHistoryCommand(
            ClinicId, Guid.NewGuid(), "chronic", "Tiểu đường");

        var result = await _service.AddMedicalHistoryAsync(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task RemoveMedicalHistory_ValidIndex_ShouldRemoveItem()
    {
        var patient = AddPatient();
        patient.AddMedicalHistory(new MedicalHistoryItem(
            "allergy", "Dị ứng Penicillin", "severe", null, DateTimeOffset.UtcNow));
        patient.AddMedicalHistory(new MedicalHistoryItem(
            "chronic", "Cao huyết áp", "moderate", null, DateTimeOffset.UtcNow));

        var result = await _service.RemoveMedicalHistoryAsync(
            new RemoveMedicalHistoryCommand(ClinicId, PatientId, 0), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var remaining = Assert.Single(patient.MedicalHistory);
        Assert.Equal("chronic", remaining.Type);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(1)] // only one entry exists
    public async Task RemoveMedicalHistory_IndexOutOfRange_ShouldFail(int index)
    {
        var patient = AddPatient();
        patient.AddMedicalHistory(new MedicalHistoryItem(
            "allergy", "Dị ứng Penicillin", "severe", null, DateTimeOffset.UtcNow));

        var result = await _service.RemoveMedicalHistoryAsync(
            new RemoveMedicalHistoryCommand(ClinicId, PatientId, index), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.invalid_index", result.Error!.Code);
        Assert.Single(patient.MedicalHistory); // unchanged
    }

    [Fact]
    public async Task RemoveMedicalHistory_UnknownPatient_ShouldReturnNotFound()
    {
        var result = await _service.RemoveMedicalHistoryAsync(
            new RemoveMedicalHistoryCommand(ClinicId, Guid.NewGuid(), 0), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task GetMedicalHistory_ShouldReturnIndexBasedDtos()
    {
        var patient = AddPatient();
        patient.AddMedicalHistory(new MedicalHistoryItem(
            "allergy", "Dị ứng Penicillin", "severe", "note 1", DateTimeOffset.UtcNow));
        patient.AddMedicalHistory(new MedicalHistoryItem(
            "chronic", "Cao huyết áp", "moderate", null, DateTimeOffset.UtcNow));

        var result = await _service.GetMedicalHistoryAsync(
            new GetMedicalHistoryQuery(ClinicId, PatientId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var items = result.Value!;
        Assert.Equal(2, items.Length);
        Assert.Equal(["0", "1"], items.Select(item => item.Id).ToArray());
        Assert.Equal("note 1", items[0].Notes);
        Assert.Null(items[1].Notes);
    }

    [Fact]
    public async Task GetMedicalHistory_UnknownPatient_ShouldReturnNotFound()
    {
        var result = await _service.GetMedicalHistoryAsync(
            new GetMedicalHistoryQuery(ClinicId, Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.not_found", result.Error!.Code);
    }
}
