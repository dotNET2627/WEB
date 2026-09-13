namespace DentalManagement.Domain.Common;

public abstract class AuditableEntity : AggregateRoot
{
    protected AuditableEntity(Guid id)
        : base(id)
    {
    }

    public DateTimeOffset CreatedAt { get; protected set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; protected set; } = DateTimeOffset.UtcNow;

    protected void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
}
