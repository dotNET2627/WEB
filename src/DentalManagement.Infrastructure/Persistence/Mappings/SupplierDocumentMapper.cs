using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class SupplierDocumentMapper
{
    public static SupplierDocument ToDocument(Supplier supplier) => new()
    {
        Id = supplier.Id,
        ClinicId = supplier.ClinicId,
        Code = supplier.Code,
        Name = supplier.Name,
        Phone = supplier.Phone,
        Email = supplier.Email,
        Address = supplier.Address,
        ContactPerson = supplier.ContactPerson,
        IsActive = supplier.IsActive,
        CreatedAt = supplier.CreatedAt,
        UpdatedAt = supplier.UpdatedAt
    };

    public static Supplier ToDomain(SupplierDocument doc) =>
        Supplier.Rehydrate(
            doc.Id,
            doc.ClinicId,
            doc.Code,
            doc.Name,
            doc.Phone,
            doc.Email,
            doc.Address,
            doc.ContactPerson,
            doc.IsActive,
            doc.CreatedAt,
            doc.UpdatedAt);
}
