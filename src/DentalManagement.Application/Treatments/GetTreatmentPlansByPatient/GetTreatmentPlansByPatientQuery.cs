using DentalManagement.Application.Treatments.Common;

namespace DentalManagement.Application.Treatments.GetTreatmentPlansByPatient;

public sealed record GetTreatmentPlansByPatientQuery(Guid PatientId);
