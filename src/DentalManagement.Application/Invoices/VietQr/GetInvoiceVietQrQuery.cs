namespace DentalManagement.Application.Invoices.VietQr;

public sealed record GetInvoiceVietQrQuery(
    Guid ClinicId,
    Guid InvoiceId,
    decimal? Amount = null);
