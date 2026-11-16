namespace DentalManagement.Application.Invoices.CreateInvoice;

public sealed record CreateInvoiceCommand(
    Guid PatientId,
    Guid ClinicId,
    Guid? AppointmentId,
    string? Notes,
    decimal DiscountAmount,
    decimal DiscountPercent,
    IReadOnlyList<InvoiceLineRequest> Lines);

public sealed record InvoiceLineRequest(
    string Description,
    int Quantity,
    decimal UnitPrice,
    Guid? ServiceId,
    string? ToothNumber);
