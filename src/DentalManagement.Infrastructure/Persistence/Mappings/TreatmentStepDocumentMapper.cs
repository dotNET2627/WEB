using DentalManagement.Domain.Treatments;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class TreatmentStepDocumentMapper
{
    public static TreatmentStepDocument ToDocument(TreatmentStep step) => new()
    {
        Id = step.Id,
        TreatmentPlanId = step.TreatmentPlanId,
        ClinicId = step.ClinicId,
        StepName = step.StepName,
        ServiceId = step.ServiceId,
        DoctorId = step.DoctorId,
        ToothNumber = step.ToothNumber,
        Cost = step.Cost,
        OrderIndex = step.OrderIndex,
        Status = step.Status.ToString(),
        StartedAt = step.StartedAt,
        CompletedAt = step.CompletedAt,
        Notes = step.Notes,
        CreatedAt = step.CreatedAt,
        UpdatedAt = step.UpdatedAt
    };

    public static TreatmentStep ToDomain(TreatmentStepDocument doc)
    {
        var status = Enum.TryParse<TreatmentStepStatus>(doc.Status, out var parsedStatus)
            ? parsedStatus
            : TreatmentStepStatus.NotStarted;

        return TreatmentStep.Rehydrate(
            doc.Id,
            doc.TreatmentPlanId,
            doc.ClinicId,
            doc.StepName,
            doc.ServiceId,
            doc.DoctorId,
            doc.ToothNumber,
            doc.Cost,
            doc.OrderIndex,
            status,
            doc.StartedAt,
            doc.CompletedAt,
            doc.Notes,
            doc.CreatedAt,
            doc.UpdatedAt);
    }
}
