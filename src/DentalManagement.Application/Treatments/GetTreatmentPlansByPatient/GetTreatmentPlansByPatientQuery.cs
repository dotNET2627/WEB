namespace DentalManagement.Application.Treatments.GetTreatmentPlansByPatient;

public sealed record GetTreatmentPlansByPatientQuery(Guid ClinicId, Guid PatientId);
