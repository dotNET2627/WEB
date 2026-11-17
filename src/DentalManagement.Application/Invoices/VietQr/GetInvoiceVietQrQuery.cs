namespace DentalManagement.Application.Invoices.VietQr;

public sealed record GetInvoiceVietQrQuery(
    Guid InvoiceId,
    decimal? Amount = null);
