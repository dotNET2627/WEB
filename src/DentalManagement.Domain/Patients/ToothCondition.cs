namespace DentalManagement.Domain.Patients;

/// <summary>Five anatomical tooth surfaces (FDI): Mesial, Distal, Occlusal/Incisal, Buccal, Lingual.</summary>
public enum ToothSurface
{
    M,
    D,
    O,
    B,
    L
}

/// <summary>Clinical condition recorded for a single tooth on the odontogram.</summary>
public enum ToothConditionType
{
    Healthy,
    Caries,
    Filled,
    Extracted,
    Crown,
    RootCanon
}

/// <summary>
/// Condition of one tooth, embedded in the <see cref="Patient"/> aggregate.
/// Tooth numbers follow the FDI notation: permanent teeth 11-48, primary teeth 51-85.
/// </summary>
public sealed record ToothCondition
{
    public ToothCondition(
        int toothNumber,
        ToothConditionType condition,
        IEnumerable<ToothSurface>? surfaces,
        string? note,
        DateTimeOffset updatedAt,
        string? updatedBy = null)
    {
        if (!IsValidToothNumber(toothNumber))
        {
            throw new ArgumentOutOfRangeException(
                nameof(toothNumber),
                toothNumber,
                "Tooth number must be valid FDI notation (11-48 permanent, 51-85 primary).");
        }

        if (!Enum.IsDefined(condition))
        {
            throw new ArgumentOutOfRangeException(nameof(condition), condition, "Unknown tooth condition.");
        }

        ToothNumber = toothNumber;
        Condition = condition;
        Surfaces = (surfaces ?? []).Distinct().ToArray();
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        UpdatedAt = updatedAt;
        UpdatedBy = string.IsNullOrWhiteSpace(updatedBy) ? null : updatedBy.Trim();
    }

    public int ToothNumber { get; }
    public ToothConditionType Condition { get; }
    public IReadOnlyList<ToothSurface> Surfaces { get; }
    public string? Note { get; }
    public DateTimeOffset UpdatedAt { get; }
    public string? UpdatedBy { get; }

    /// <summary>
    /// Validates an FDI tooth number:
    /// tens digit 1-4 (permanent quadrants) requires units 1-8 (11-18, 21-28, 31-38, 41-48);
    /// tens digit 5-8 (primary quadrants) requires units 1-5 (51-55, 61-65, 71-75, 81-85).
    /// </summary>
    public static bool IsValidToothNumber(int toothNumber)
    {
        if (toothNumber is < 11 or > 85)
        {
            return false;
        }

        var tens = toothNumber / 10;
        var units = toothNumber % 10;
        if (tens is < 1 or > 8)
        {
            return false;
        }

        var maxUnits = tens <= 4 ? 8 : 5;
        return units >= 1 && units <= maxUnits;
    }
}
