using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Billing;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Invoices.Reports.GetFinancialReport;

public sealed class GetFinancialReportHandler
    : IQueryHandler<GetFinancialReportQuery, Result<FinancialReportDto>>
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPatientRepository _patients;

    public GetFinancialReportHandler(IInvoiceRepository invoices, IPatientRepository patients)
    {
        _invoices = invoices;
        _patients = patients;
    }

    public async Task<Result<FinancialReportDto>> Handle(GetFinancialReportQuery query, CancellationToken cancellationToken)
    {
        // Default time window: Today (from 00:00:00 to 23:59:59.999 in UTC)
        var nowUtc = DateTimeOffset.UtcNow;
        var startOfToday = new DateTimeOffset(nowUtc.Year, nowUtc.Month, nowUtc.Day, 0, 0, 0, TimeSpan.Zero);
        var endOfToday = startOfToday.AddDays(1).AddTicks(-1);

        var from = query.From ?? startOfToday;
        var to = query.To ?? endOfToday;

        var allInvoices = await _invoices.GetForFinancialReportAsync(query.ClinicId, from, to, cancellationToken);

        if (query.PatientId.HasValue)
        {
            allInvoices = allInvoices.Where(i => i.PatientId == query.PatientId.Value).ToList();
        }

        // Fetch patient names
        var patientIds = allInvoices.Select(i => i.PatientId).Distinct().ToList();
        var patients = patientIds.Count > 0
            ? await _patients.GetByIdsAsync(patientIds, cancellationToken)
            : [];
        var patientMap = patients.ToDictionary(p => p.Id);

        // 1. Transactions in period
        var transactions = new List<FinancialPaymentTransactionDto>();
        foreach (var inv in allInvoices)
        {
            patientMap.TryGetValue(inv.PatientId, out var patient);
            var pName = patient?.FullName ?? "–";
            var pCode = patient?.PatientCode;

            foreach (var p in inv.Payments)
            {
                if (p.PaidAt >= from && p.PaidAt <= to)
                {
                    transactions.Add(new FinancialPaymentTransactionDto(
                        p.Id,
                        inv.Id,
                        inv.InvoiceNumber,
                        inv.PatientId,
                        pName,
                        pCode,
                        p.Amount,
                        p.Method,
                        p.PaidAt,
                        p.Reference,
                        p.Note));
                }
            }
        }

        transactions = transactions.OrderByDescending(t => t.PaidAt).ToList();

        // Revenue breakdown
        decimal cashCollected = transactions
            .Where(t => t.Method.Equals("Cash", StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);

        decimal transferCollected = transactions
            .Where(t => t.Method.Equals("Transfer", StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);

        decimal cardCollected = transactions
            .Where(t => t.Method.Equals("Card", StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);

        decimal insuranceCollected = transactions
            .Where(t => t.Method.Equals("Insurance", StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);

        decimal otherCollected = transactions
            .Where(t => !t.Method.Equals("Cash", StringComparison.OrdinalIgnoreCase) &&
                        !t.Method.Equals("Transfer", StringComparison.OrdinalIgnoreCase) &&
                        !t.Method.Equals("Card", StringComparison.OrdinalIgnoreCase) &&
                        !t.Method.Equals("Insurance", StringComparison.OrdinalIgnoreCase))
            .Sum(t => t.Amount);

        decimal totalCollected = cashCollected + transferCollected + cardCollected + insuranceCollected + otherCollected;

        // 2. Invoices issued in period
        var issuedInvoices = allInvoices
            .Where(i => i.IssuedAt >= from && i.IssuedAt <= to && i.Status != InvoiceStatus.Cancelled)
            .ToList();

        decimal totalInvoiced = issuedInvoices.Sum(i => i.TotalAmount);
        int paidInFullCount = issuedInvoices.Count(i => i.Status == InvoiceStatus.Paid);
        int partiallyPaidCount = issuedInvoices.Count(i => i.Status == InvoiceStatus.PartiallyPaid);
        int unpaidCount = issuedInvoices.Count(i => i.Status == InvoiceStatus.Unpaid);

        var invoiceSummaries = issuedInvoices.Select(inv =>
        {
            patientMap.TryGetValue(inv.PatientId, out var patient);
            return new FinancialInvoiceSummaryDto(
                inv.Id,
                inv.InvoiceNumber,
                inv.PatientId,
                patient?.FullName ?? "–",
                patient?.PatientCode,
                inv.IssuedAt,
                inv.TotalAmount,
                inv.PaidAmount,
                inv.OutstandingAmount,
                inv.Status.ToString());
        }).OrderByDescending(i => i.IssuedAt).ToList();

        // 3. Outstanding Debtors
        var debtorGroups = allInvoices
            .Where(i => i.Status != InvoiceStatus.Cancelled && i.OutstandingAmount > 0)
            .GroupBy(i => i.PatientId);

        var debtors = new List<PatientDebtSummaryDto>();
        foreach (var group in debtorGroups)
        {
            patientMap.TryGetValue(group.Key, out var patient);
            debtors.Add(new PatientDebtSummaryDto(
                group.Key,
                patient?.FullName ?? "–",
                patient?.PatientCode,
                patient?.PhoneNumber,
                group.Count(),
                group.Sum(i => i.OutstandingAmount),
                group.Max(i => i.IssuedAt)));
        }

        debtors = debtors.OrderByDescending(d => d.TotalDebt).ToList();
        decimal totalOutstandingDebt = debtors.Sum(d => d.TotalDebt);

        var dto = new FinancialReportDto(
            query.ClinicId,
            from,
            to,
            totalCollected,
            cashCollected,
            transferCollected,
            cardCollected,
            insuranceCollected,
            otherCollected,
            transactions.Count,
            totalInvoiced,
            issuedInvoices.Count,
            paidInFullCount,
            partiallyPaidCount,
            unpaidCount,
            totalOutstandingDebt,
            debtors.Count,
            transactions,
            invoiceSummaries,
            debtors);

        return Result<FinancialReportDto>.Success(dto);
    }
}
