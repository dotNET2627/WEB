using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Common;

public abstract class AuditableEntity : AggregateRoot
{
    protected AuditableEntity(Guid id)
        : base(id)
    {
    }

    protected AuditableEntity(Guid id, DateTimeOffset createdAt, DateTimeOffset updatedAt)
        : base(id)
    {
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public DateTimeOffset CreatedAt { get; protected set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; protected set; } = DateTimeOffset.UtcNow;

    protected void Touch() => UpdatedAt = DateTimeOffset.UtcNow;

    public void SetAuditDates(DateTimeOffset createdAt, DateTimeOffset updatedAt)
    {
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }
}
