namespace DentalManagement.Domain.Doctors;

public sealed record WorkScheduleItem(
    Guid Id,
    Guid? ClinicId,
    int DayOfWeek,
    string StartTime,
    string EndTime,
    bool IsActive = true)
{
    public static WorkScheduleItem Create(
        Guid? id,
        Guid? clinicId,
        int dayOfWeek,
        string startTime,
        string endTime,
        bool isActive = true)
    {
        if (dayOfWeek is < 1 or > 7)
        {
            throw new ArgumentOutOfRangeException(nameof(dayOfWeek), "DayOfWeek must be between 1 (Sunday) and 7 (Saturday).");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(startTime);
        ArgumentException.ThrowIfNullOrWhiteSpace(endTime);

        if (!TimeOnly.TryParse(startTime, out var start))
        {
            throw new ArgumentException("Giờ bắt đầu phải có định dạng HH:mm hợp lệ.", nameof(startTime));
        }

        if (!TimeOnly.TryParse(endTime, out var end))
        {
            throw new ArgumentException("Giờ kết thúc phải có định dạng HH:mm hợp lệ.", nameof(endTime));
        }

        if (end <= start)
        {
            throw new ArgumentException("Giờ kết thúc ca trực phải sau giờ bắt đầu.", nameof(endTime));
        }

        return new WorkScheduleItem(
            id.HasValue && id.Value != Guid.Empty ? id.Value : Guid.NewGuid(),
            clinicId,
            dayOfWeek,
            start.ToString("HH:mm"),
            end.ToString("HH:mm"),
            isActive);
    }

    public static WorkScheduleItem Create(
        Guid? clinicId,
        int dayOfWeek,
        string startTime,
        string endTime,
        bool isActive = true) =>
        Create(null, clinicId, dayOfWeek, startTime, endTime, isActive);

    public bool OverlapsWith(WorkScheduleItem other)
    {
        if (DayOfWeek != other.DayOfWeek || !IsActive || !other.IsActive)
        {
            return false;
        }

        if (TimeOnly.TryParse(StartTime, out var s1) &&
            TimeOnly.TryParse(EndTime, out var e1) &&
            TimeOnly.TryParse(other.StartTime, out var s2) &&
            TimeOnly.TryParse(other.EndTime, out var e2))
        {
            return s1 < e2 && e1 > s2;
        }

        return false;
    }

    public string GetDayOfWeekName() => DayOfWeek switch
    {
        1 => "Chủ Nhật",
        2 => "Thứ Hai",
        3 => "Thứ Ba",
        4 => "Thứ Tư",
        5 => "Thứ Năm",
        6 => "Thứ Sáu",
        7 => "Thứ Bảy",
        _ => $"Thứ {DayOfWeek}"
    };
}
