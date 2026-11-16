namespace DentalManagement.Application.Invoices.ListInvoices;

public sealed record ListInvoicesQuery(
    Guid ClinicId,
    DateTimeOffset? From,
    DateTimeOffset? To,
    Guid? PatientId);

public sealed record InvoiceSummaryDto(
    Guid Id,
    string InvoiceNumber,
    Guid PatientId,
    string PatientName,
    string Status,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal OutstandingAmount,
    DateTimeOffset IssuedAt,
    Guid? AppointmentId);
