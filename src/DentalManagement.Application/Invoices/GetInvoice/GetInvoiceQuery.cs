namespace DentalManagement.Application.Invoices.GetInvoice;

public sealed record GetInvoiceQuery(Guid InvoiceId);

public sealed record InvoiceDto(
    Guid Id,
    Guid PatientId,
    string PatientName,
    Guid ClinicId,
    string InvoiceNumber,
    Guid? AppointmentId,
    string Status,
    decimal SubTotal,
    decimal DiscountAmount,
    decimal DiscountPercent,
    decimal DiscountValue,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal OutstandingAmount,
    string? Notes,
    DateTimeOffset IssuedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<InvoiceLineDto> Lines,
    IReadOnlyList<PaymentDto> Payments);

public sealed record InvoiceLineDto(
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal Amount,
    Guid? ServiceId,
    string? ToothNumber);

public sealed record PaymentDto(
    decimal Amount,
    string Method,
    DateTimeOffset PaidAt,
    string? Reference);
