using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Invoices.ListInvoices;

public sealed class ListInvoicesHandler
    : IQueryHandler<ListInvoicesQuery, Result<IReadOnlyList<InvoiceSummaryDto>>>
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPatientRepository _patients;

    public ListInvoicesHandler(IInvoiceRepository invoices, IPatientRepository patients)
    {
        _invoices = invoices;
        _patients = patients;
    }

    public async Task<Result<IReadOnlyList<InvoiceSummaryDto>>> Handle(
        ListInvoicesQuery query, CancellationToken cancellationToken)
    {
        var invoices = await _invoices.GetByClinicAsync(
            query.ClinicId, query.From, query.To, query.PatientId, cancellationToken);

        var patientIds = invoices.Select(i => i.PatientId).Distinct().ToList();
        var patients = await _patients.GetByIdsAsync(query.ClinicId, patientIds, cancellationToken);
        var patientMap = patients.ToDictionary(p => p.Id, p => p.FullName);

        var dtos = invoices.Select(inv => new InvoiceSummaryDto(
            inv.Id,
            inv.InvoiceNumber,
            inv.PatientId,
            patientMap.TryGetValue(inv.PatientId, out var name) ? name : "–",
            inv.Status.ToString(),
            inv.TotalAmount,
            inv.PaidAmount,
            inv.OutstandingAmount,
            inv.IssuedAt,
            inv.AppointmentId)).ToList();

        return Result<IReadOnlyList<InvoiceSummaryDto>>.Success(dtos);
    }
}
