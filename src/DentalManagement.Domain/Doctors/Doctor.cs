using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Doctors;

public sealed class Doctor : AuditableEntity
{
    private readonly List<WorkScheduleItem> _workSchedules = [];

    public Doctor(
        Guid id,
        Guid userId,
        string medicalLicenseNumber,
        Guid? clinicId = null,
        int yearsOfExperience = 0,
        string? specialty = null,
        string? biography = null)
        : base(id)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId cannot be empty.", nameof(userId));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(medicalLicenseNumber);

        UserId = userId;
        MedicalLicenseNumber = medicalLicenseNumber.Trim();
        ClinicId = clinicId;
        YearsOfExperience = Math.Max(0, yearsOfExperience);
        Specialty = specialty?.Trim();
        Biography = biography?.Trim();
    }

    public Guid UserId { get; private set; }
    public Guid? ClinicId { get; private set; }
    public string MedicalLicenseNumber { get; private set; }
    public int YearsOfExperience { get; private set; }
    public string? Specialty { get; private set; }
    public string? Biography { get; private set; }

    public IReadOnlyCollection<WorkScheduleItem> WorkSchedules => _workSchedules.AsReadOnly();

    public void UpdateProfile(
        string medicalLicenseNumber,
        string? specialty,
        int yearsOfExperience,
        string? biography,
        Guid? clinicId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(medicalLicenseNumber);

        MedicalLicenseNumber = medicalLicenseNumber.Trim();
        Specialty = specialty?.Trim();
        YearsOfExperience = Math.Max(0, yearsOfExperience);
        Biography = biography?.Trim();
        ClinicId = clinicId;
        Touch();
    }

    public void AssignClinic(Guid? clinicId)
    {
        ClinicId = clinicId;
        Touch();
    }

    public bool HasScheduleConflict(WorkScheduleItem newItem, Guid? excludingScheduleId = null)
    {
        return _workSchedules.Any(existing =>
            (excludingScheduleId == null || existing.Id != excludingScheduleId) &&
            existing.OverlapsWith(newItem));
    }

    public void SetWorkSchedules(IEnumerable<WorkScheduleItem> schedules)
    {
        var list = schedules?.ToList() ?? [];

        // Validate internal overlaps in new schedule list
        for (int i = 0; i < list.Count; i++)
        {
            for (int j = i + 1; j < list.Count; j++)
            {
                if (list[i].OverlapsWith(list[j]))
                {
                    throw new InvalidOperationException($"Ca trực bị trùng lặp thời gian trong cùng một ngày: Thứ {list[i].DayOfWeek} ({list[i].StartTime}-{list[i].EndTime}) và ({list[j].StartTime}-{list[j].EndTime}).");
                }
            }
        }

        _workSchedules.Clear();
        _workSchedules.AddRange(list);
        Touch();
    }

    public void AddWorkSchedule(WorkScheduleItem item)
    {
        ArgumentNullException.ThrowIfNull(item);
        if (HasScheduleConflict(item))
        {
            throw new InvalidOperationException($"Ca trực bị trùng với ca trực đã có trong thứ {item.DayOfWeek} ({item.StartTime} - {item.EndTime}).");
        }

        _workSchedules.Add(item);
        Touch();
    }

    public bool RemoveWorkSchedule(Guid scheduleId)
    {
        var count = _workSchedules.RemoveAll(s => s.Id == scheduleId);
        if (count > 0)
        {
            Touch();
            return true;
        }

        return false;
    }

    public static Doctor Rehydrate(
        Guid id,
        Guid userId,
        Guid? clinicId,
        string medicalLicenseNumber,
        int yearsOfExperience,
        string? specialty,
        string? biography,
        IEnumerable<WorkScheduleItem> workSchedules,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var doctor = new Doctor(id, userId, medicalLicenseNumber, clinicId, yearsOfExperience, specialty, biography);
        doctor.SetAuditDates(createdAt, updatedAt);

        if (workSchedules is not null)
        {
            doctor._workSchedules.AddRange(workSchedules);
        }

        return doctor;
    }
}
