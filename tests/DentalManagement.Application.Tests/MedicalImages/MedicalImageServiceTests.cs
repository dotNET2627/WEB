using DentalManagement.Application.MedicalImages;
using DentalManagement.Application.Tests.Fakes;
using DentalManagement.Domain.Patients;
using Xunit;

namespace DentalManagement.Application.Tests.MedicalImages;

public class MedicalImageServiceTests
{
    private static readonly Guid ClinicId = Guid.NewGuid();
    private static readonly Guid PatientId = Guid.NewGuid();

    private readonly FakePatientRepository _patients = new();
    private readonly FakeMedicalImageRepository _images = new();
    private readonly FakeFileStorage _storage = new();
    private readonly MedicalImageService _service;

    public MedicalImageServiceTests()
    {
        _service = new MedicalImageService(_patients, _images, _storage);
        _patients.Patients.Add(new Patient(PatientId, ClinicId, "Phạm Văn Đạt", "BN004"));
    }

    private static UploadMedicalImageCommand Command(
        string type = "xray",
        string title = "Phim toàn cảnh Panorama",
        string fileName = "panorama.jpg",
        string contentType = "image/jpeg",
        long fileSize = 1024,
        int? toothNumber = null,
        string? notes = null) =>
        new(ClinicId, PatientId, type, title, fileName, contentType, fileSize, toothNumber, notes);

    private static MemoryStream Content() => new(new byte[64]);

    [Fact]
    public async Task Upload_ValidJpeg_ShouldSaveFileAndMetadata()
    {
        var result = await _service.UploadAsync(Command(), Content(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var dto = result.Value!;
        Assert.Equal("xray", dto.Type);
        Assert.Equal("Phim toàn cảnh Panorama", dto.Title);
        Assert.Equal($"/api/v1/patients/{dto.PatientId}/images/{dto.Id}/content", dto.Url);
        Assert.Equal(PatientId, dto.PatientId);

        var stored = Assert.Single(_storage.Files);
        Assert.EndsWith(".jpg", stored.Key);
        Assert.Single(_images.Images);
    }

    [Fact]
    public async Task Open_ShouldReturnStoredFileOnlyForTheMatchingClinicAndPatient()
    {
        using var content = Content();
        var uploaded = await _service.UploadAsync(Command(), content, CancellationToken.None);
        var imageId = uploaded.Value!.Id;

        var wrongClinic = await _service.OpenAsync(Guid.NewGuid(), PatientId, imageId, CancellationToken.None);
        var wrongPatient = await _service.OpenAsync(ClinicId, Guid.NewGuid(), imageId, CancellationToken.None);
        var result = await _service.OpenAsync(ClinicId, PatientId, imageId, CancellationToken.None);

        Assert.True(wrongClinic.IsFailure);
        Assert.True(wrongPatient.IsFailure);
        Assert.True(result.IsSuccess);
        Assert.Equal("image/jpeg", result.Value!.ContentType);
        await using var opened = result.Value.Content;
        Assert.Equal(content.Length, opened.Length);
    }

    [Fact]
    public async Task Upload_ValidDicom_ShouldBeAccepted()
    {
        var result = await _service.UploadAsync(
            Command(type: "x-ray", fileName: "tooth.dcm", contentType: "application/dicom"),
            Content(),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("application/dicom", result.Value!.ContentType);
    }

    [Fact]
    public async Task Upload_ExtraoralTypeToken_ShouldParse()
    {
        var result = await _service.UploadAsync(
            Command(type: "Extraoral", fileName: "face.png", contentType: "image/png"),
            Content(),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("extraoral", result.Value!.Type);
    }

    [Fact]
    public async Task Upload_FileTooLarge_ShouldFailWithTooLargeCode()
    {
        var result = await _service.UploadAsync(
            Command(fileSize: MedicalImageLimits.MaxFileSizeBytes + 1),
            Content(),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.too_large", result.Error!.Code);
        Assert.Empty(_storage.Files);
        Assert.Empty(_images.Images);
    }

    [Fact]
    public async Task Upload_EmptyFile_ShouldFail()
    {
        var result = await _service.UploadAsync(
            Command(fileSize: 0), Content(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.empty_file", result.Error!.Code);
    }

    [Theory]
    [InlineData("scan.txt", "image/jpeg")]
    [InlineData("scan.gif", "image/png")]
    public async Task Upload_UnsupportedExtension_ShouldFail(
        string fileName, string contentType)
    {
        var result = await _service.UploadAsync(
            Command(fileName: fileName, contentType: contentType),
            Content(),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.unsupported_file_type", result.Error!.Code);
    }

    [Fact]
    public async Task Upload_UnsupportedContentType_ShouldFail()
    {
        var result = await _service.UploadAsync(
            Command(fileName: "xray.jpg", contentType: "text/plain"),
            Content(),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.unsupported_file_type", result.Error!.Code);
    }

    [Theory]
    [InlineData("panorex")]
    [InlineData("periapical")]
    [InlineData("")]
    [InlineData("unknown")]
    public async Task Upload_UnknownImageTypeToken_ShouldFail(string type)
    {
        var result = await _service.UploadAsync(
            Command(type: type), Content(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.invalid", result.Error!.Code);
    }

    [Fact]
    public async Task Upload_EmptyTitle_ShouldFail()
    {
        var result = await _service.UploadAsync(
            Command(title: "   "), Content(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.invalid", result.Error!.Code);
    }

    [Theory]
    [InlineData(19)]
    [InlineData(56)]
    public async Task Upload_InvalidFdiToothNumber_ShouldFail(int toothNumber)
    {
        var result = await _service.UploadAsync(
            Command(toothNumber: toothNumber), Content(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.invalid", result.Error!.Code);
    }

    [Fact]
    public async Task Upload_UnknownPatient_ShouldReturnNotFound()
    {
        var command = Command() with { PatientId = Guid.NewGuid() };

        var result = await _service.UploadAsync(command, Content(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.not_found", result.Error!.Code);
        Assert.Empty(_storage.Files);
    }

    [Fact]
    public async Task Upload_WhenDatabaseFails_ShouldCleanUpStoredFile()
    {
        _images.FailAdd = true;

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UploadAsync(Command(), Content(), CancellationToken.None));

        Assert.Empty(_storage.Files);
    }

    [Fact]
    public async Task List_ShouldReturnDtosForPatient()
    {
        await _service.UploadAsync(
            Command(title: "Phim 1"), Content(), CancellationToken.None);
        await _service.UploadAsync(
            Command(title: "Phim 2", fileName: "second.png", contentType: "image/png"),
            Content(),
            CancellationToken.None);

        var result = await _service.ListAsync(ClinicId, PatientId, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var items = result.Value!;
        Assert.Equal(2, items.Length);
        Assert.All(items, dto => Assert.Equal($"/api/v1/patients/{dto.PatientId}/images/{dto.Id}/content", dto.Url));
    }

    [Fact]
    public async Task List_UnknownPatient_ShouldReturnNotFound()
    {
        var result = await _service.ListAsync(ClinicId, Guid.NewGuid(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("patient.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task Delete_ExistingImage_ShouldRemoveMetadataAndPhysicalFile()
    {
        var upload = await _service.UploadAsync(Command(), Content(), CancellationToken.None);
        var imageId = upload.Value!.Id;
        var storageKey = Assert.Single(_images.Images).StorageKey;

        var result = await _service.DeleteAsync(ClinicId, PatientId, imageId, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(_images.Images);
        Assert.Equal(storageKey, Assert.Single(_storage.DeletedKeys));
        Assert.Empty(_storage.Files);
    }

    [Fact]
    public async Task Delete_UnknownImage_ShouldReturnNotFound()
    {
        var result = await _service.DeleteAsync(
            ClinicId, PatientId, Guid.NewGuid(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task Delete_AnotherPatientsImage_ShouldReturnNotFound()
    {
        var upload = await _service.UploadAsync(Command(), Content(), CancellationToken.None);

        var result = await _service.DeleteAsync(
            ClinicId, Guid.NewGuid(), upload.Value!.Id, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("image.not_found", result.Error!.Code);
        Assert.Single(_images.Images); // unchanged
    }

    [Fact]
    public async Task Delete_WhenFileRemovalFails_StillSucceeds()
    {
        var upload = await _service.UploadAsync(Command(), Content(), CancellationToken.None);
        _storage.ThrowOnDelete = true;

        var result = await _service.DeleteAsync(
            ClinicId, PatientId, upload.Value!.Id, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(_images.Images);
    }
}
