namespace DentalManagement.Application.Invoices.CancelInvoice;

public sealed record CancelInvoiceCommand(Guid ClinicId, Guid InvoiceId);
