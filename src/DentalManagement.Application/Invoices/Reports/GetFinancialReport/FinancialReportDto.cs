namespace DentalManagement.Application.Invoices.Reports.GetFinancialReport;

public sealed record FinancialReportDto(
    Guid ClinicId,
    DateTimeOffset From,
    DateTimeOffset To,
    // KPI Revenue Breakdown
    decimal TotalCollected,
    decimal CashCollected,
    decimal TransferCollected,
    decimal CardCollected,
    decimal InsuranceCollected,
    decimal OtherCollected,
    int TotalTransactionsCount,
    // Invoices summary in period
    decimal TotalInvoiced,
    int InvoicesCount,
    int PaidInFullCount,
    int PartiallyPaidCount,
    int UnpaidCount,
    // Outstanding Debt
    decimal TotalOutstandingDebt,
    int DebtorsCount,
    // Detailed Lists
    IReadOnlyList<FinancialPaymentTransactionDto> Transactions,
    IReadOnlyList<FinancialInvoiceSummaryDto> Invoices,
    IReadOnlyList<PatientDebtSummaryDto> Debtors);

public sealed record FinancialPaymentTransactionDto(
    Guid? PaymentId,
    Guid InvoiceId,
    string InvoiceNumber,
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    decimal Amount,
    string Method,
    DateTimeOffset PaidAt,
    string? Reference,
    string? Note);

public sealed record FinancialInvoiceSummaryDto(
    Guid InvoiceId,
    string InvoiceNumber,
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    DateTimeOffset IssuedAt,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal OutstandingAmount,
    string Status);

public sealed record PatientDebtSummaryDto(
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    string? PhoneNumber,
    int UnpaidInvoicesCount,
    decimal TotalDebt,
    DateTimeOffset LastIssuedAt);
