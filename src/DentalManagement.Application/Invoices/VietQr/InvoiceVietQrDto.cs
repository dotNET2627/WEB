namespace DentalManagement.Application.Invoices.VietQr;

public sealed record InvoiceVietQrDto(
    Guid InvoiceId,
    string InvoiceNumber,
    string PatientName,
    decimal Amount,
    string BankBin,
    string BankName,
    string AccountNumber,
    string AccountName,
    string Description,
    string QrImageUrl,
    string QrPayload);
