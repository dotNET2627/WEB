using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Patients;

public sealed class Patient : AuditableEntity
{
    private readonly List<MedicalHistoryItem> _medicalHistory = [];
    private readonly List<ToothCondition> _teeth = [];

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

    /// <summary>Teeth with a recorded condition. Healthy teeth are absent from the list.</summary>
    public IReadOnlyCollection<ToothCondition> Teeth
        => _teeth.AsReadOnly();

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

    // ---- Tiền sử bệnh lý (embedded collection) ----

    public void AddMedicalHistory(MedicalHistoryItem item)
    {
        ArgumentNullException.ThrowIfNull(item);

        _medicalHistory.Add(item);
        Touch();
    }

    public void UpdateMedicalHistory(int index, MedicalHistoryItem item)
    {
        ArgumentNullException.ThrowIfNull(item);
        EnsureHistoryIndex(index);

        _medicalHistory[index] = item;
        Touch();
    }

    public bool RemoveMedicalHistory(int index)
    {
        EnsureHistoryIndex(index);

        _medicalHistory.RemoveAt(index);
        Touch();
        return true;
    }

    // ---- Sơ đồ răng / Odontogram (embedded collection) ----

    public ToothCondition? GetTooth(int toothNumber) =>
        _teeth.FirstOrDefault(tooth => tooth.ToothNumber == toothNumber);

    /// <summary>Inserts or replaces the record for <paramref name="condition.ToothNumber"/>.</summary>
    public ToothCondition UpsertToothCondition(ToothCondition condition)
    {
        ArgumentNullException.ThrowIfNull(condition);

        var index = _teeth.FindIndex(tooth => tooth.ToothNumber == condition.ToothNumber);
        if (index >= 0)
        {
            _teeth[index] = condition;
        }
        else
        {
            _teeth.Add(condition);
        }

        Touch();
        return condition;
    }

    /// <summary>
    /// Removes the record for a tooth. Used when the tooth is marked back to healthy.
    /// Returns <c>false</c> when no record existed.
    /// </summary>
    public bool RemoveToothCondition(int toothNumber)
    {
        var index = _teeth.FindIndex(tooth => tooth.ToothNumber == toothNumber);
        if (index < 0)
        {
            return false;
        }

        _teeth.RemoveAt(index);
        Touch();
        return true;
    }

    private void EnsureHistoryIndex(int index)
    {
        if (index < 0 || index >= _medicalHistory.Count)
        {
            throw new ArgumentOutOfRangeException(
                nameof(index),
                index,
                "Medical history index is out of range.");
        }
    }
} // Kết thúc lớp Patient.

public sealed record MedicalHistoryItem(
    string Type,
    string Name,
    string? Severity,
    string? Note,
    DateTimeOffset UpdatedAt);
