using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Clinics;

public sealed class Clinic : AuditableEntity
{
    public Clinic(
        Guid id,
        string name,
        string address,
        string? phoneNumber = null,
        string? email = null,
        string? description = null,
        IReadOnlyDictionary<string, string>? openingHours = null,
        string? logo = null,
        bool isActive = true)
        : base(id)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);

        Name = name.Trim();
        Address = address.Trim();
        PhoneNumber = phoneNumber?.Trim();
        Email = email?.Trim().ToLowerInvariant();
        Description = description?.Trim();
        OpeningHours = openingHours;
        Logo = logo?.Trim();
        IsActive = isActive;
    }

    public string Name { get; private set; }
    public string Address { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? Email { get; private set; }
    public string? Description { get; private set; }
    public IReadOnlyDictionary<string, string>? OpeningHours { get; private set; }
    public string? Logo { get; private set; }
    public bool IsActive { get; private set; }

    public void UpdateDetails(
        string name,
        string address,
        string? phoneNumber,
        string? email,
        string? description,
        IReadOnlyDictionary<string, string>? openingHours,
        string? logo)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);

        Name = name.Trim();
        Address = address.Trim();
        PhoneNumber = phoneNumber?.Trim();
        Email = email?.Trim().ToLowerInvariant();
        Description = description?.Trim();
        OpeningHours = openingHours;
        Logo = logo?.Trim();
        Touch();
    }

    public void Deactivate()
    {
        IsActive = false;
        Touch();
    }

    public void Activate()
    {
        IsActive = true;
        Touch();
    }

    public static Clinic Rehydrate(
        Guid id,
        string name,
        string address,
        string? phoneNumber,
        string? email,
        string? description,
        IReadOnlyDictionary<string, string>? openingHours,
        string? logo,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var clinic = new Clinic(id, name, address, phoneNumber, email, description, openingHours, logo, isActive);
        clinic.SetAuditDates(createdAt, updatedAt);
        return clinic;
    }
}
