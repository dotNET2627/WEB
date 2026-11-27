using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Treatments;

/// <summary>
/// Đại diện cho một hạng mục / giai đoạn điều trị (Treatment Step / Item) thuộc về một phác đồ điều trị.
/// </summary>
public sealed class TreatmentStep : AuditableEntity
{
    public TreatmentStep(
        Guid id,
        Guid treatmentPlanId,
        Guid clinicId,
        string stepName,
        Guid? serviceId = null,
        Guid? doctorId = null,
        string? toothNumber = null,
        decimal cost = 0,
        int orderIndex = 0,
        string? notes = null)
        : base(id)
    {
        if (treatmentPlanId == Guid.Empty)
        {
            throw new ArgumentException("TreatmentPlanId không được để trống.", nameof(treatmentPlanId));
        }

        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("ClinicId không được để trống.", nameof(clinicId));
        }

        if (string.IsNullOrWhiteSpace(stepName))
        {
            throw new ArgumentException("Tên hạng mục điều trị không được để trống.", nameof(stepName));
        }

        if (cost < 0)
        {
            throw new ArgumentException("Chi phí hạng mục không được là số âm.", nameof(cost));
        }

        TreatmentPlanId = treatmentPlanId;
        ClinicId = clinicId;
        StepName = stepName.Trim();
        ServiceId = serviceId;
        DoctorId = doctorId;
        ToothNumber = toothNumber?.Trim();
        Cost = cost;
        OrderIndex = orderIndex;
        Notes = notes?.Trim();
        Status = TreatmentStepStatus.NotStarted;
    }

    public Guid TreatmentPlanId { get; private set; }
    public Guid ClinicId { get; private set; }
    public string StepName { get; private set; }
    public Guid? ServiceId { get; private set; }
    public Guid? DoctorId { get; private set; }
    public string? ToothNumber { get; private set; }
    public decimal Cost { get; private set; }
    public int OrderIndex { get; private set; }
    public TreatmentStepStatus Status { get; private set; }
    public DateTimeOffset? StartedAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public string? Notes { get; private set; }

    public void UpdateDetails(
        string stepName,
        Guid? serviceId,
        Guid? doctorId,
        string? toothNumber,
        decimal cost,
        int orderIndex,
        string? notes)
    {
        if (string.IsNullOrWhiteSpace(stepName))
        {
            throw new ArgumentException("Tên hạng mục điều trị không được để trống.", nameof(stepName));
        }

        if (cost < 0)
        {
            throw new ArgumentException("Chi phí hạng mục không được là số âm.", nameof(cost));
        }

        StepName = stepName.Trim();
        ServiceId = serviceId;
        DoctorId = doctorId;
        ToothNumber = toothNumber?.Trim();
        Cost = cost;
        OrderIndex = orderIndex;
        Notes = notes?.Trim();
        Touch();
    }

    public void ChangeStatus(TreatmentStepStatus newStatus)
    {
        if (Status == newStatus) return;

        Status = newStatus;

        if (newStatus == TreatmentStepStatus.InProgress && StartedAt is null)
        {
            StartedAt = DateTimeOffset.UtcNow;
        }
        else if (newStatus == TreatmentStepStatus.Completed)
        {
            StartedAt ??= DateTimeOffset.UtcNow;
            CompletedAt = DateTimeOffset.UtcNow;
        }
        else if (newStatus == TreatmentStepStatus.NotStarted)
        {
            StartedAt = null;
            CompletedAt = null;
        }

        Touch();
    }

    public void UpdateOrder(int orderIndex)
    {
        OrderIndex = orderIndex;
        Touch();
    }

    public static TreatmentStep Rehydrate(
        Guid id,
        Guid treatmentPlanId,
        Guid clinicId,
        string stepName,
        Guid? serviceId,
        Guid? doctorId,
        string? toothNumber,
        decimal cost,
        int orderIndex,
        TreatmentStepStatus status,
        DateTimeOffset? startedAt,
        DateTimeOffset? completedAt,
        string? notes,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var step = new TreatmentStep(
            id,
            treatmentPlanId,
            clinicId,
            stepName,
            serviceId,
            doctorId,
            toothNumber,
            cost,
            orderIndex,
            notes)
        {
            Status = status,
            StartedAt = startedAt,
            CompletedAt = completedAt
        };

        step.SetAuditDates(createdAt, updatedAt);
        return step;
    }
}
