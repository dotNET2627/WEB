namespace DentalManagement.Application.Invoices.Reports.GetFinancialReport;

public sealed record GetFinancialReportQuery(
    Guid ClinicId,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    Guid? PatientId = null);
