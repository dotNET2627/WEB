using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Invoices.GetInvoice;

public sealed class GetInvoiceHandler
    : IQueryHandler<GetInvoiceQuery, Result<InvoiceDto>>
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPatientRepository _patients;

    public GetInvoiceHandler(IInvoiceRepository invoices, IPatientRepository patients)
    {
        _invoices = invoices;
        _patients = patients;
    }

    public async Task<Result<InvoiceDto>> Handle(GetInvoiceQuery query, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetByIdAsync(query.InvoiceId, cancellationToken);
        if (invoice is null || invoice.ClinicId != query.ClinicId)
            return Result<InvoiceDto>.Failure("invoice.not_found", $"Không tìm thấy hóa đơn '{query.InvoiceId}'.");

        var patient = await _patients.GetByIdAsync(invoice.ClinicId, invoice.PatientId, cancellationToken);
        var patientName = patient?.FullName ?? "–";

        return Result<InvoiceDto>.Success(new InvoiceDto(
            invoice.Id,
            invoice.PatientId,
            patientName,
            invoice.ClinicId,
            invoice.InvoiceNumber,
            invoice.AppointmentId,
            invoice.Status.ToString(),
            invoice.SubTotal,
            invoice.DiscountAmount,
            invoice.DiscountPercent,
            invoice.DiscountValue,
            invoice.TotalAmount,
            invoice.PaidAmount,
            invoice.OutstandingAmount,
            invoice.Notes,
            invoice.IssuedAt,
            invoice.CreatedAt,
            invoice.UpdatedAt,
            invoice.Lines.Select(l => new InvoiceLineDto(
                l.Description, l.Quantity, l.UnitPrice, l.Amount, l.ServiceId, l.ToothNumber)).ToList(),
            invoice.Payments.Select(p => new PaymentDto(
                p.Amount, p.Method, p.PaidAt, p.Reference, p.Note, p.Id)).ToList()));
    }
}
