using DentalManagement.Domain.Billing;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class CashierShiftDocumentMapper
{
    public static CashierShiftDocument ToDocument(CashierShift shift) => new()
    {
        Id = shift.Id,
        ClinicId = shift.ClinicId,
        CashierId = shift.CashierId,
        CashierName = shift.CashierName,
        ShiftNumber = shift.ShiftNumber,
        StartedAt = shift.StartedAt,
        ClosedAt = shift.ClosedAt,
        Status = shift.Status.ToString(),
        OpeningCash = shift.OpeningCash,
        SystemCashAmount = shift.SystemCashAmount,
        SystemTransferAmount = shift.SystemTransferAmount,
        SystemCardAmount = shift.SystemCardAmount,
        SystemInsuranceAmount = shift.SystemInsuranceAmount,
        ActualCashAmount = shift.ActualCashAmount,
        ActualTransferAmount = shift.ActualTransferAmount,
        ActualCardAmount = shift.ActualCardAmount,
        Notes = shift.Notes,
        CreatedAt = shift.CreatedAt,
        UpdatedAt = shift.UpdatedAt
    };

    public static CashierShift ToDomain(CashierShiftDocument doc)
    {
        var status = Enum.TryParse<ShiftStatus>(doc.Status, out var s) ? s : ShiftStatus.Open;

        return CashierShift.Rehydrate(
            doc.Id,
            doc.ClinicId,
            doc.CashierId,
            doc.CashierName,
            doc.ShiftNumber,
            doc.StartedAt,
            doc.ClosedAt,
            status,
            doc.OpeningCash,
            doc.SystemCashAmount,
            doc.SystemTransferAmount,
            doc.SystemCardAmount,
            doc.SystemInsuranceAmount,
            doc.ActualCashAmount,
            doc.ActualTransferAmount,
            doc.ActualCardAmount,
            doc.Notes,
            doc.CreatedAt,
            doc.UpdatedAt);
    }
}
