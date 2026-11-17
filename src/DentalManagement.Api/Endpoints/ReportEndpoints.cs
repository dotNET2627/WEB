using DentalManagement.Application.Common;
using DentalManagement.Application.Invoices.Reports.GetFinancialReport;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/reports").WithTags("Reports");

        // GET /financial — Báo cáo tài chính doanh thu, thực thu, tiền mặt vs chuyển khoản, công nợ
        group.MapGet("/financial", async (
            Guid clinicId,
            DateTimeOffset? from,
            DateTimeOffset? to,
            Guid? patientId,
            IQueryHandler<GetFinancialReportQuery, Result<FinancialReportDto>> handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetFinancialReportQuery(clinicId, from, to, patientId), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(statusCode: 500, detail: result.Error!.Message);
        })
        .WithName("GetFinancialReport")
        .RequireAuthorization(DefaultPermissions.System.ViewReports);

        return endpoints;
    }
}
