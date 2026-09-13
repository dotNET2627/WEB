namespace DentalManagement.Domain.Common;

public interface IDomainEvent
{
    DateTimeOffset OccurredOn { get; }
}
