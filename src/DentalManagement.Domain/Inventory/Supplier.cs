using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Inventory;

public sealed class Supplier : Entity
{
    private Supplier(
        Guid id,
        Guid clinicId,
        string code,
        string name,
        string? phone,
        string? email,
        string? address,
        string? contactPerson,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
        : base(id)
    {
        ClinicId = clinicId;
        Code = code;
        Name = name;
        Phone = phone;
        Email = email;
        Address = address;
        ContactPerson = contactPerson;
        IsActive = isActive;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public Guid ClinicId { get; }
    public string Code { get; }
    public string Name { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? Address { get; private set; }
    public string? ContactPerson { get; private set; }
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static Result<Supplier> Create(
        Guid clinicId,
        string code,
        string name,
        string? phone,
        string? email,
        string? address,
        string? contactPerson,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            return Result<Supplier>.Failure("supplier.invalid_clinic", "ClinicId là bắt buộc.");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            return Result<Supplier>.Failure("supplier.invalid_code", "Mã nhà cung cấp không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return Result<Supplier>.Failure("supplier.invalid_name", "Tên nhà cung cấp không được để trống.");
        }

        return Result<Supplier>.Success(new Supplier(
            Guid.NewGuid(),
            clinicId,
            code.Trim().ToUpperInvariant(),
            name.Trim(),
            phone?.Trim(),
            email?.Trim(),
            address?.Trim(),
            contactPerson?.Trim(),
            true,
            now,
            now));
    }

    public Result Update(
        string name,
        string? phone,
        string? email,
        string? address,
        string? contactPerson,
        bool isActive,
        DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure("supplier.invalid_name", "Tên nhà cung cấp không được để trống.");
        }

        Name = name.Trim();
        Phone = phone?.Trim();
        Email = email?.Trim();
        Address = address?.Trim();
        ContactPerson = contactPerson?.Trim();
        IsActive = isActive;
        UpdatedAt = now;
        return Result.Success();
    }

    public static Supplier Rehydrate(
        Guid id,
        Guid clinicId,
        string code,
        string name,
        string? phone,
        string? email,
        string? address,
        string? contactPerson,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new(id, clinicId, code, name, phone, email, address, contactPerson, isActive, createdAt, updatedAt);
}
