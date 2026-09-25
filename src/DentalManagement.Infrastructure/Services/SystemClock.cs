using DentalManagement.Application.Abstractions.Services;

namespace DentalManagement.Infrastructure.Services;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
