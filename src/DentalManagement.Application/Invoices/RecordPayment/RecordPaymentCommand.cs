namespace DentalManagement.Application.Invoices.RecordPayment;

public sealed record RecordPaymentCommand(
    Guid ClinicId,
    Guid InvoiceId,
    decimal Amount,
    string Method,   // Cash | Card | Transfer | Insurance | Other
    string? Reference,
    string? Note = null);
