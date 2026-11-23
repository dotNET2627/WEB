namespace DentalManagement.Domain.Treatments;

/// <summary>
/// Trạng thái của từng hạng mục / giai đoạn điều trị (dùng cho Kanban & Timeline)
/// </summary>
public enum TreatmentStepStatus
{
    NotStarted = 0, // Chưa làm (To Do)
    InProgress = 1, // Đang làm (In Progress)
    Completed = 2   // Hoàn thành (Done)
}
