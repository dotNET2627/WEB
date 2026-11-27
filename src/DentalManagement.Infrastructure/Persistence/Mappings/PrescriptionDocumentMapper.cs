using DentalManagement.Domain.Prescriptions;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class PrescriptionDocumentMapper
{
    public static PrescriptionDocument ToDocument(Prescription prescription) => new()
    {
        Id = prescription.Id,
        ClinicId = prescription.ClinicId,
        Code = prescription.Code,
        PatientId = prescription.PatientId,
        PatientName = prescription.PatientName,
        PatientCode = prescription.PatientCode,
        DoctorId = prescription.DoctorId,
        DoctorName = prescription.DoctorName,
        Diagnosis = prescription.Diagnosis,
        MedicalNotes = prescription.MedicalNotes,
        Status = prescription.Status.ToString(),
        Items = prescription.Items
            .Select(i => new PrescriptionItemDocument
            {
                InventoryItemId = i.InventoryItemId,
                MedicationName = i.MedicationName,
                Dosage = i.Dosage,
                Quantity = i.Quantity,
                Unit = i.Unit,
                Instructions = i.Instructions
            })
            .ToList(),
        CreatedAt = prescription.CreatedAt,
        UpdatedAt = prescription.UpdatedAt,
        DispensedAt = prescription.DispensedAt
    };

    public static Prescription ToDomain(PrescriptionDocument doc)
    {
        var status = Enum.TryParse<PrescriptionStatus>(doc.Status, out var parsed)
            ? parsed
            : PrescriptionStatus.Issued;

        var items = doc.Items.Select(i => new PrescriptionItem(
            i.InventoryItemId,
            i.MedicationName,
            i.Dosage,
            i.Quantity,
            i.Unit,
            i.Instructions));

        return Prescription.Rehydrate(
            doc.Id,
            doc.ClinicId,
            doc.Code,
            doc.PatientId,
            doc.PatientName,
            doc.PatientCode,
            doc.DoctorId,
            doc.DoctorName,
            doc.Diagnosis,
            doc.MedicalNotes,
            status,
            items,
            doc.CreatedAt,
            doc.UpdatedAt,
            doc.DispensedAt);
    }
}
