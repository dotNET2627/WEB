namespace DentalManagement.Domain.Patients;

/// <summary>JSON token mapping for <see cref="ToothConditionType"/> (snake_case on the wire).</summary>
public static class ToothConditionTypeExtensions
{
    public static string ToToken(this ToothConditionType condition) => condition switch
    {
        ToothConditionType.Healthy => "healthy",
        ToothConditionType.Caries => "caries",
        ToothConditionType.Filled => "filled",
        ToothConditionType.Extracted => "extracted",
        ToothConditionType.Crown => "crown",
        ToothConditionType.RootCanon => "root_canal",
        _ => throw new ArgumentOutOfRangeException(nameof(condition), condition, "Unknown tooth condition.")
    };

    public static bool TryParse(string? token, out ToothConditionType condition)
    {
        condition = default;
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        switch (Normalize(token))
        {
            case "healthy":
                condition = ToothConditionType.Healthy;
                return true;
            case "caries":
                condition = ToothConditionType.Caries;
                return true;
            case "filled":
            case "filling":
                condition = ToothConditionType.Filled;
                return true;
            case "extracted":
            case "extraction":
                condition = ToothConditionType.Extracted;
                return true;
            case "crown":
                condition = ToothConditionType.Crown;
                return true;
            case "rootcanal":
                condition = ToothConditionType.RootCanon;
                return true;
            default:
                return false;
        }
    }

    private static string Normalize(string token) =>
        token.Trim().ToLowerInvariant().Replace("-", string.Empty).Replace("_", string.Empty);
}

/// <summary>JSON token mapping for <see cref="ToothSurface"/> (single letters on the wire).</summary>
public static class ToothSurfaceExtensions
{
    public static string ToToken(this ToothSurface surface) => surface switch
    {
        ToothSurface.M => "M",
        ToothSurface.D => "D",
        ToothSurface.O => "O",
        ToothSurface.B => "B",
        ToothSurface.L => "L",
        _ => throw new ArgumentOutOfRangeException(nameof(surface), surface, "Unknown tooth surface.")
    };

    public static bool TryParse(string? token, out ToothSurface surface)
    {
        surface = default;
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        switch (token.Trim().ToUpperInvariant())
        {
            case "M":
                surface = ToothSurface.M;
                return true;
            case "D":
                surface = ToothSurface.D;
                return true;
            case "O":
                surface = ToothSurface.O;
                return true;
            case "B":
                surface = ToothSurface.B;
                return true;
            case "L":
                surface = ToothSurface.L;
                return true;
            default:
                return false;
        }
    }

    public static bool TryParseAll(
        IEnumerable<string?>? tokens,
        out IReadOnlyList<ToothSurface> surfaces)
    {
        var parsed = new List<ToothSurface>();
        if (tokens is not null)
        {
            foreach (var token in tokens)
            {
                if (!TryParse(token, out var surface))
                {
                    surfaces = [];
                    return false;
                }

                parsed.Add(surface);
            }
        }

        surfaces = parsed.Distinct().ToArray();
        return true;
    }
}
