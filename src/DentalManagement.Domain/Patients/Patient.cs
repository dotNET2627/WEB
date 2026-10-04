using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Patients;

public sealed class Patient : AuditableEntity
{
    private readonly List<MedicalHistoryItem> _medicalHistory = [];

    public Patient(
        Guid id,
        Guid clinicId,
        string fullName,
        string? patientCode = null)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException(
                "Patient full name is required.",
                nameof(fullName));
        }

        ClinicId = clinicId;
        FullName = fullName.Trim();
        PatientCode = string.IsNullOrWhiteSpace(patientCode)
            ? null
            : patientCode.Trim();
    }

    public Guid ClinicId { get; private set; }
    public string? PatientCode { get; private set; }
    public string FullName { get; private set; }
    public DateOnly? DateOfBirth { get; private set; }
    public string? PhoneNumber { get; private set; }

    public IReadOnlyCollection<MedicalHistoryItem> MedicalHistory
        => _medicalHistory.AsReadOnly();

    // Hàm này phải nằm BÊN TRONG lớp Patient.
    public void UpdateProfile(
        string fullName,
        string? patientCode,
        string? phoneNumber,
        DateOnly? dateOfBirth)
    {
        UpdateContact(fullName, phoneNumber, dateOfBirth);

        PatientCode = string.IsNullOrWhiteSpace(patientCode)
            ? null
            : patientCode.Trim();
    }

    public void UpdateContact(
        string fullName,
        string? phoneNumber,
        DateOnly? dateOfBirth)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException(
                "Patient full name is required.",
                nameof(fullName));
        }

        FullName = fullName.Trim();
        PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber)
            ? null
            : phoneNumber.Trim();

        DateOfBirth = dateOfBirth;
        Touch();
    }

    public void AddMedicalHistory(MedicalHistoryItem item)
    {
        _medicalHistory.Add(item);
        Touch();
    }
} // Kết thúc lớp Patient.

public sealed record MedicalHistoryItem(
    string Type,
    string Name,
    string? Severity,
    string? Note,
    DateTimeOffset UpdatedAt);