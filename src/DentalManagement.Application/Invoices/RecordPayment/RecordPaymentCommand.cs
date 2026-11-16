namespace DentalManagement.Application.Invoices.RecordPayment;

public sealed record RecordPaymentCommand(
    Guid InvoiceId,
    decimal Amount,
    string Method,   // Cash | Card | Transfer | Insurance | Other
    string? Reference);
