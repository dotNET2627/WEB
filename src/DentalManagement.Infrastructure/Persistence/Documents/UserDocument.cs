using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class UserDocument : MongoDocument
{
    [BsonElement("email")]
    public string Email { get; init; } = string.Empty;

    [BsonElement("fullName")]
    public string FullName { get; init; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; init; } = string.Empty;

    [BsonElement("isActive")]
    public bool IsActive { get; init; } = true;

    [BsonElement("accessFailedCount")]
    public int AccessFailedCount { get; init; }

    [BsonElement("lockoutEnd")]
    public DateTimeOffset? LockoutEnd { get; init; }

    [BsonElement("defaultClinicId")]
    public Guid? DefaultClinicId { get; init; }

    [BsonElement("assignments")]
    public IReadOnlyCollection<RoleAssignmentDocument> Assignments { get; init; } = [];
}

public sealed record RoleAssignmentDocument(
    [property: BsonElement("roleId")] Guid RoleId,
    [property: BsonElement("clinicId")] Guid? ClinicId,
    [property: BsonElement("assignedAt")] DateTimeOffset AssignedAt,
    [property: BsonElement("assignedBy")] Guid? AssignedBy);