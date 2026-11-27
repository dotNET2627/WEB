using DentalManagement.Domain.Treatments;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class TreatmentPlanDocumentMapper
{
    public static TreatmentPlanDocument ToDocument(TreatmentPlan plan) => new()
    {
        Id = plan.Id,
        PatientId = plan.PatientId,
        ClinicId = plan.ClinicId,
        DoctorId = plan.DoctorId,
        Name = plan.Name,
        EstimatedCost = plan.EstimatedCost,
        StartDate = plan.StartDate,
        EndDate = plan.EndDate,
        Status = plan.Status.ToString(),
        Notes = plan.Notes,
        CreatedAt = plan.CreatedAt,
        UpdatedAt = plan.UpdatedAt
    };

    public static TreatmentPlan ToDomain(TreatmentPlanDocument doc)
    {
        var status = Enum.TryParse<TreatmentPlanStatus>(doc.Status, out var parsedStatus)
            ? parsedStatus
            : TreatmentPlanStatus.InProgress;

        return TreatmentPlan.Rehydrate(
            doc.Id,
            doc.PatientId,
            doc.ClinicId,
            doc.Name,
            doc.EstimatedCost,
            doc.StartDate,
            doc.EndDate,
            doc.DoctorId,
            status,
            doc.Notes,
            doc.CreatedAt,
            doc.UpdatedAt);
    }
}
