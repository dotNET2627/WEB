using DentalManagement.Domain.Billing;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class InvoiceDocumentMapper
{
    public static InvoiceDocument ToDocument(Invoice invoice) => new()
    {
        Id = invoice.Id,
        PatientId = invoice.PatientId,
        ClinicId = invoice.ClinicId,
        InvoiceNumber = invoice.InvoiceNumber,
        AppointmentId = invoice.AppointmentId,
        Status = invoice.Status.ToString(),
        DiscountAmount = invoice.DiscountAmount,
        DiscountPercent = invoice.DiscountPercent,
        Notes = invoice.Notes,
        IssuedAt = invoice.IssuedAt,
        CreatedAt = invoice.CreatedAt,
        UpdatedAt = invoice.UpdatedAt,
        Lines = invoice.Lines
            .Select(l => new InvoiceLineDocument(l.Description, l.Quantity, l.UnitPrice, l.ServiceId, l.ToothNumber))
            .ToList(),
        Payments = invoice.Payments
            .Select(p => new PaymentDocument(p.Amount, p.Method, p.PaidAt, p.Reference, p.Note, p.Id))
            .ToList()
    };

    public static Invoice ToDomain(InvoiceDocument doc)
    {
        var status = Enum.TryParse<InvoiceStatus>(doc.Status, out var s) ? s : InvoiceStatus.Unpaid;

        var lines = doc.Lines.Select(l =>
            new InvoiceLine(l.Description, l.Quantity, l.UnitPrice, l.ServiceId, l.ToothNumber));

        var payments = doc.Payments.Select(p =>
            new Payment(p.Amount, p.Method, p.PaidAt, p.Reference, p.Note, p.Id));

        return Invoice.Rehydrate(
            doc.Id,
            doc.PatientId,
            doc.ClinicId,
            doc.InvoiceNumber,
            doc.AppointmentId,
            status,
            doc.DiscountAmount,
            doc.DiscountPercent,
            doc.Notes,
            doc.IssuedAt,
            doc.CreatedAt,
            doc.UpdatedAt,
            lines,
            payments);
    }
}
