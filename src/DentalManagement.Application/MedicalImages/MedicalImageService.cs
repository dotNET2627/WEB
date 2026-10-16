using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.MedicalImages;
using DentalManagement.Domain.Patients;

namespace DentalManagement.Application.MedicalImages;

/// <summary>Upload, list and delete medical images (X-Ray / intraoral / extraoral photos).</summary>
public sealed class MedicalImageService(
    IPatientRepository patients,
    IMedicalImageRepository images,
    IFileStorage storage)
{
    public async Task<Result<MedicalImageDto>> UploadAsync(
        UploadMedicalImageCommand command,
        Stream content,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(content);

        if (command.ClinicId == Guid.Empty || command.PatientId == Guid.Empty)
            return Failure<MedicalImageDto>("patient.invalid", "Chưa chọn phòng khám hoặc bệnh nhân.");
        if (command.FileSize <= 0)
            return Failure<MedicalImageDto>("image.empty_file", "Tệp ảnh trống.");
        if (command.FileSize > MedicalImageLimits.MaxFileSizeBytes)
            return Failure<MedicalImageDto>("image.too_large", "Dung lượng ảnh tối đa 15 MB.");
        if (!MedicalImageLimits.IsAllowedFileName(command.FileName))
            return Failure<MedicalImageDto>(
                "image.unsupported_file_type", "Chỉ chấp nhận tệp .jpg, .jpeg, .png, .dcm hoặc .dicom.");
        if (!MedicalImageLimits.IsAllowedContentType(command.ContentType))
            return Failure<MedicalImageDto>(
                "image.unsupported_file_type", "Chỉ chấp nhận ảnh JPEG, PNG hoặc phim DICOM.");
        if (!MedicalImageTypeExtensions.TryParse(command.Type, out var type))
            return Failure<MedicalImageDto>(
                "image.invalid", "Loại ảnh không hợp lệ (xray, intraoral, extraoral).");
        if (string.IsNullOrWhiteSpace(command.Title) || command.Title.Trim().Length > MedicalImageLimits.MaxTitleLength)
            return Failure<MedicalImageDto>("image.invalid", "Tên ảnh là bắt buộc và tối đa 200 ký tự.");
        if (command.Notes?.Length > MedicalImageLimits.MaxNotesLength)
            return Failure<MedicalImageDto>("image.invalid", "Ghi chú tối đa 1000 ký tự.");
        if (command.ToothNumber is { } toothNumber &&
            !ToothCondition.IsValidToothNumber(toothNumber))
            return Failure<MedicalImageDto>(
                "image.invalid", "Mã răng không hợp lệ theo chuẩn FDI (11-48 răng vĩnh viễn, 51-85 răng sữa).");

        var patient = await patients.GetByIdAsync(command.ClinicId, command.PatientId, cancellationToken);
        if (patient is null)
            return Failure<MedicalImageDto>("patient.not_found", "Không tìm thấy bệnh nhân.");

        var storageKey = await storage.SaveAsync(content, command.FileName, command.ContentType, cancellationToken);
        var image = new MedicalImage(
            Guid.NewGuid(),
            command.ClinicId,
            command.PatientId,
            type,
            command.Title,
            storageKey,
            SanitizeFileName(command.FileName),
            command.ContentType,
            command.FileSize,
            command.ToothNumber,
            command.Notes,
            command.CapturedAt,
            command.UploadedBy);

        try
        {
            await images.AddAsync(image, cancellationToken);
        }
        catch
        {
            await TryDeleteFileAsync(storageKey);
            throw;
        }

        return Result<MedicalImageDto>.Success(ToDto(image));
    }

    public async Task<Result<MedicalImageDto[]>> ListAsync(
        Guid clinicId, Guid patientId, CancellationToken cancellationToken)
    {
        if (clinicId == Guid.Empty || patientId == Guid.Empty)
            return Failure<MedicalImageDto[]>("patient.invalid", "Chưa chọn phòng khám hoặc bệnh nhân.");

        var patient = await patients.GetByIdAsync(clinicId, patientId, cancellationToken);
        if (patient is null)
            return Failure<MedicalImageDto[]>("patient.not_found", "Không tìm thấy bệnh nhân.");

        var list = await images.ListByPatientAsync(clinicId, patientId, cancellationToken);
        return Result<MedicalImageDto[]>.Success(list
            .Select(ToDto)
            .OrderByDescending(image => image.CreatedAt)
            .ToArray());
    }

    public async Task<Result> DeleteAsync(
        Guid clinicId, Guid patientId, Guid imageId, CancellationToken cancellationToken)
    {
        var image = await images.GetByIdAsync(clinicId, patientId, imageId, cancellationToken);
        if (image is null)
            return Result.Failure("image.not_found", "Không tìm thấy ảnh y tế.");

        if (!await images.DeleteAsync(clinicId, patientId, imageId, cancellationToken))
            return Result.Failure("image.not_found", "Không tìm thấy ảnh y tế.");

        // Remove the physical file only after the metadata is gone.
        await TryDeleteFileAsync(image.StorageKey);
        return Result.Success();
    }

    public static MedicalImageDto ToDto(MedicalImage image) => new(
        image.Id,
        image.PatientId,
        image.Type.ToToken(),
        image.Title,
        $"{MedicalImageLimits.PublicPathPrefix}/{image.StorageKey}",
        image.ToothNumber,
        image.Notes,
        image.CapturedAt,
        image.CreatedAt,
        image.UpdatedAt);

    private async Task TryDeleteFileAsync(string storageKey)
    {
        try
        {
            await storage.DeleteAsync(storageKey, CancellationToken.None);
        }
        catch
        {
            // Best effort: never fail the request because the file was already gone.
        }
    }

    private static string SanitizeFileName(string fileName)
    {
        var name = Path.GetFileName(fileName.Replace('\0', ' ').Trim());
        if (name.Length > 200)
        {
            name = name[..200];
        }

        return string.IsNullOrWhiteSpace(name) ? "image" : name;
    }

    private static Result<T> Failure<T>(string code, string message) => Result<T>.Failure(code, message);
}

/// <summary>Multipart metadata for one uploaded image file.</summary>
public sealed record UploadMedicalImageCommand(
    Guid ClinicId,
    Guid PatientId,
    string Type,
    string Title,
    string FileName,
    string ContentType,
    long FileSize,
    int? ToothNumber = null,
    string? Notes = null,
    DateTimeOffset? CapturedAt = null,
    string? UploadedBy = null);

public sealed record MedicalImageDto(
    Guid Id,
    Guid PatientId,
    string Type,
    string Title,
    string Url,
    int? ToothNumber,
    string? Notes,
    DateTimeOffset? CapturedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
