using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Prescriptions;

public sealed record PrescriptionItem(
    Guid? InventoryItemId,
    string MedicationName,
    string Dosage,
    int Quantity,
    string Unit,
    string Instructions);

public sealed class Prescription : Entity
{
    private readonly List<PrescriptionItem> _items;

    private Prescription(
        Guid id,
        Guid clinicId,
        string code,
        Guid patientId,
        string patientName,
        string? patientCode,
        Guid? doctorId,
        string doctorName,
        string diagnosis,
        string? medicalNotes,
        PrescriptionStatus status,
        IEnumerable<PrescriptionItem> items,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        DateTimeOffset? dispensedAt)
        : base(id)
    {
        ClinicId = clinicId;
        Code = code;
        PatientId = patientId;
        PatientName = patientName;
        PatientCode = patientCode;
        DoctorId = doctorId;
        DoctorName = doctorName;
        Diagnosis = diagnosis;
        MedicalNotes = medicalNotes;
        Status = status;
        _items = items.ToList();
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
        DispensedAt = dispensedAt;
    }

    public Guid ClinicId { get; }
    public string Code { get; }
    public Guid PatientId { get; }
    public string PatientName { get; }
    public string? PatientCode { get; }
    public Guid? DoctorId { get; }
    public string DoctorName { get; }
    public string Diagnosis { get; }
    public string? MedicalNotes { get; }
    public PrescriptionStatus Status { get; private set; }
    public IReadOnlyList<PrescriptionItem> Items => _items.AsReadOnly();
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? DispensedAt { get; private set; }

    public static Result<Prescription> Create(
        Guid clinicId,
        string? code,
        Guid patientId,
        string patientName,
        string? patientCode,
        Guid? doctorId,
        string doctorName,
        string diagnosis,
        string? medicalNotes,
        bool isDraft,
        IReadOnlyList<PrescriptionItem> items,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            return Result<Prescription>.Failure("prescription.invalid_clinic", "ClinicId là bắt buộc.");
        }

        if (patientId == Guid.Empty || string.IsNullOrWhiteSpace(patientName))
        {
            return Result<Prescription>.Failure("prescription.invalid_patient", "Thông tin bệnh nhân không hợp lệ.");
        }

        if (string.IsNullOrWhiteSpace(diagnosis))
        {
            return Result<Prescription>.Failure("prescription.invalid_diagnosis", "Chẩn đoán không được để trống.");
        }

        if (items is null || items.Count == 0)
        {
            return Result<Prescription>.Failure("prescription.empty_items", "Đơn thuốc phải có ít nhất 1 loại thuốc.");
        }

        if (items.Any(i => string.IsNullOrWhiteSpace(i.MedicationName) || i.Quantity <= 0))
        {
            return Result<Prescription>.Failure("prescription.invalid_item", "Tên thuốc không được để trống và số lượng phải > 0.");
        }

        var generatedCode = string.IsNullOrWhiteSpace(code)
            ? $"DON-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}"
            : code.Trim().ToUpperInvariant();

        var prescription = new Prescription(
            Guid.NewGuid(),
            clinicId,
            generatedCode,
            patientId,
            patientName.Trim(),
            patientCode?.Trim(),
            doctorId,
            string.IsNullOrWhiteSpace(doctorName) ? "Bác sĩ điều trị" : doctorName.Trim(),
            diagnosis.Trim(),
            medicalNotes?.Trim(),
            isDraft ? PrescriptionStatus.Draft : PrescriptionStatus.Issued,
            items,
            now,
            now,
            null);

        return Result<Prescription>.Success(prescription);
    }

    public Result MarkDispensed(DateTimeOffset now)
    {
        if (Status == PrescriptionStatus.Cancelled)
        {
            return Result.Failure("prescription.already_cancelled", "Không thể cấp thuốc cho đơn đã hủy.");
        }

        if (Status == PrescriptionStatus.Dispensed)
        {
            return Result.Failure("prescription.already_dispensed", "Đơn thuốc này đã được cấp phát trước đó.");
        }

        Status = PrescriptionStatus.Dispensed;
        DispensedAt = now;
        UpdatedAt = now;
        return Result.Success();
    }

    public Result Cancel(DateTimeOffset now)
    {
        if (Status == PrescriptionStatus.Dispensed)
        {
            return Result.Failure("prescription.cannot_cancel_dispensed", "Không thể hủy đơn thuốc đã cấp phát và trừ kho.");
        }

        if (Status == PrescriptionStatus.Cancelled)
        {
            return Result.Failure("prescription.already_cancelled", "Đơn thuốc đã được hủy trước đó.");
        }

        Status = PrescriptionStatus.Cancelled;
        UpdatedAt = now;
        return Result.Success();
    }

    public static Prescription Rehydrate(
        Guid id,
        Guid clinicId,
        string code,
        Guid patientId,
        string patientName,
        string? patientCode,
        Guid? doctorId,
        string doctorName,
        string diagnosis,
        string? medicalNotes,
        PrescriptionStatus status,
        IEnumerable<PrescriptionItem> items,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        DateTimeOffset? dispensedAt) =>
        new(
            id,
            clinicId,
            code,
            patientId,
            patientName,
            patientCode,
            doctorId,
            doctorName,
            diagnosis,
            medicalNotes,
            status,
            items,
            createdAt,
            updatedAt,
            dispensedAt);
}
