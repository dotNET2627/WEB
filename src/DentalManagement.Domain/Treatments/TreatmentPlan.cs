using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Treatments;

/// <summary>
/// Đại diện cho một phác đồ / kế hoạch điều trị dài hạn của bệnh nhân.
/// </summary>
public sealed class TreatmentPlan : AuditableEntity
{
    public TreatmentPlan(
        Guid id,
        Guid patientId,
        Guid clinicId,
        string name,
        decimal estimatedCost,
        DateTimeOffset startDate,
        DateTimeOffset? endDate = null,
        Guid? doctorId = null,
        string? notes = null)
        : base(id)
    {
        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("PatientId không được để trống.", nameof(patientId));
        }

        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("ClinicId không được để trống.", nameof(clinicId));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Tên phác đồ điều trị không được để trống.", nameof(name));
        }

        if (estimatedCost < 0)
        {
            throw new ArgumentException("Chi phí dự kiến không được là số âm.", nameof(estimatedCost));
        }

        if (endDate is not null && endDate < startDate)
        {
            throw new ArgumentException("Ngày kết thúc dự kiến không thể trước ngày bắt đầu.", nameof(endDate));
        }

        PatientId = patientId;
        ClinicId = clinicId;
        DoctorId = doctorId;
        Name = name.Trim();
        EstimatedCost = estimatedCost;
        StartDate = startDate;
        EndDate = endDate;
        Notes = notes?.Trim();
        Status = TreatmentPlanStatus.InProgress;
    }

    public Guid PatientId { get; private set; }
    public Guid ClinicId { get; private set; }
    public Guid? DoctorId { get; private set; }
    public string Name { get; private set; }
    public decimal EstimatedCost { get; private set; }
    public DateTimeOffset StartDate { get; private set; }
    public DateTimeOffset? EndDate { get; private set; }
    public TreatmentPlanStatus Status { get; private set; }
    public string? Notes { get; private set; }

    public void UpdateDetails(
        string name,
        decimal estimatedCost,
        DateTimeOffset startDate,
        DateTimeOffset? endDate,
        Guid? doctorId,
        string? notes)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Tên phác đồ điều trị không được để trống.", nameof(name));
        }

        if (estimatedCost < 0)
        {
            throw new ArgumentException("Chi phí dự kiến không được là số âm.", nameof(estimatedCost));
        }

        if (endDate is not null && endDate < startDate)
        {
            throw new ArgumentException("Ngày kết thúc dự kiến không thể trước ngày bắt đầu.", nameof(endDate));
        }

        Name = name.Trim();
        EstimatedCost = estimatedCost;
        StartDate = startDate;
        EndDate = endDate;
        DoctorId = doctorId;
        Notes = notes?.Trim();
        Touch();
    }

    public void ChangeStatus(TreatmentPlanStatus newStatus)
    {
        Status = newStatus;
        Touch();
    }
}
