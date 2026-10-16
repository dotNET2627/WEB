using DentalManagement.Domain.Patients;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class PatientDocumentMapper
{
    public static PatientDocument ToDocument(Patient patient) => new()
    {
        Id = patient.Id,
        ClinicId = patient.ClinicId,
        PatientCode = patient.PatientCode,
        FullName = patient.FullName,
        PhoneNumber = patient.PhoneNumber,
        DateOfBirth = patient.DateOfBirth,
        CreatedAt = patient.CreatedAt,
        UpdatedAt = patient.UpdatedAt,
        MedicalHistory = patient.MedicalHistory
            .Select(item => new MedicalHistoryDocument(item.Type, item.Name, item.Severity, item.Note, item.UpdatedAt))
            .ToArray(),
        Teeth = patient.Teeth
            .Select(tooth => new ToothConditionDocument(
                tooth.ToothNumber,
                tooth.Condition.ToToken(),
                tooth.Surfaces.Select(surface => surface.ToToken()).ToArray(),
                tooth.Note,
                tooth.UpdatedAt,
                tooth.UpdatedBy))
            .ToArray()
    };

    public static Patient ToDomain(PatientDocument document)
    {
        var patient = new Patient(document.Id, document.ClinicId, document.FullName, document.PatientCode);
        patient.UpdateContact(document.FullName, document.PhoneNumber, document.DateOfBirth);

        foreach (var item in document.MedicalHistory)
        {
            patient.AddMedicalHistory(new MedicalHistoryItem(item.Type, item.Name, item.Severity, item.Note, item.UpdatedAt));
        }

        foreach (var tooth in document.Teeth)
        {
            if (!ToothCondition.IsValidToothNumber(tooth.ToothNumber) ||
                !ToothConditionTypeExtensions.TryParse(tooth.Condition, out var condition) ||
                !ToothSurfaceExtensions.TryParseAll(tooth.Surfaces, out var surfaces))
            {
                continue; // Skip corrupt legacy entries instead of failing the whole patient.
            }

            patient.UpsertToothCondition(new ToothCondition(
                tooth.ToothNumber, condition, surfaces, tooth.Note, tooth.UpdatedAt, tooth.UpdatedBy));
        }

        // AddMedicalHistory/UpsertToothCondition bump UpdatedAt; restore the stored audit dates last.
        patient.SetAuditDates(document.CreatedAt, document.UpdatedAt);

        return patient;
    }
}
