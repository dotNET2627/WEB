using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Billing;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Invoices.VietQr;

public sealed class GetInvoiceVietQrHandler
    : IQueryHandler<GetInvoiceVietQrQuery, Result<InvoiceVietQrDto>>
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPatientRepository _patients;
    private readonly VietQrOptions _options;

    public GetInvoiceVietQrHandler(
        IInvoiceRepository invoices,
        IPatientRepository patients,
        VietQrOptions options)
    {
        _invoices = invoices;
        _patients = patients;
        _options = options;
    }

    public async Task<Result<InvoiceVietQrDto>> Handle(GetInvoiceVietQrQuery query, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetByIdAsync(query.InvoiceId, cancellationToken);
        if (invoice is null || invoice.ClinicId != query.ClinicId)
            return Result<InvoiceVietQrDto>.Failure("invoice.not_found", $"Không tìm thấy hóa đơn '{query.InvoiceId}'.");

        if (string.IsNullOrWhiteSpace(_options.DefaultBankBin) || string.IsNullOrWhiteSpace(_options.DefaultAccountNumber))
            return Result<InvoiceVietQrDto>.Failure("vietqr.not_configured", "Chưa cấu hình tài khoản nhận chuyển khoản.");

        if (invoice.Status == InvoiceStatus.Cancelled || invoice.OutstandingAmount <= 0)
            return Result<InvoiceVietQrDto>.Failure("invoice.no_balance", "Hóa đơn không còn số tiền cần thanh toán.");

        var patient = await _patients.GetByIdAsync(invoice.ClinicId, invoice.PatientId, cancellationToken);
        var patientName = patient?.FullName ?? "Bệnh nhân";

        // Amount to pay: use specified amount or default to remaining outstanding balance
        decimal amount = query.Amount.HasValue && query.Amount.Value > 0
            ? Math.Min(query.Amount.Value, invoice.OutstandingAmount)
            : invoice.OutstandingAmount;

        var bankBin = _options.DefaultBankBin;
        var bankName = _options.DefaultBankName;
        var accountNumber = _options.DefaultAccountNumber;
        var accountName = _options.DefaultAccountName;
        var template = string.IsNullOrWhiteSpace(_options.Template) ? "compact2" : _options.Template;

        // Auto-generated transfer memo: e.g. "TT HD-202611-0001"
        var description = $"TT {invoice.InvoiceNumber}";

        var payload = VietQrHelper.GenerateEmvcoPayload(bankBin, accountNumber, amount, description);
        var qrImageUrl = VietQrHelper.GenerateQuickLinkUrl(bankBin, accountNumber, amount, description, accountName, template);

        var dto = new InvoiceVietQrDto(
            invoice.Id,
            invoice.InvoiceNumber,
            patientName,
            amount,
            bankBin,
            bankName,
            accountNumber,
            accountName,
            description,
            qrImageUrl,
            payload);

        return Result<InvoiceVietQrDto>.Success(dto);
    }
}
