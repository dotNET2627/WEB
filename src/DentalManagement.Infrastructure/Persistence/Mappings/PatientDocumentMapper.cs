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

        return patient;
    }
}
