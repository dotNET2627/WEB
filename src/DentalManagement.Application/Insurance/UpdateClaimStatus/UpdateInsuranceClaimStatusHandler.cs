using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Billing;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Insurance.UpdateClaimStatus;

public sealed class UpdateInsuranceClaimStatusHandler
    : ICommandHandler<UpdateInsuranceClaimStatusCommand, Result>
{
    private readonly IInsuranceClaimRepository _claims;
    private readonly IInvoiceRepository _invoices;
    private readonly ITransactionRunner _tx;

    public UpdateInsuranceClaimStatusHandler(
        IInsuranceClaimRepository claims,
        IInvoiceRepository invoices,
        ITransactionRunner tx)
    {
        _claims = claims;
        _invoices = invoices;
        _tx = tx;
    }

    public Task<Result> Handle(UpdateInsuranceClaimStatusCommand command, CancellationToken cancellationToken) =>
        _tx.ExecuteAsync(async ct =>
    {
        var claim = await _claims.GetByIdAsync(command.ClaimId, ct);
        if (claim is null || claim.ClinicId != command.ClinicId)
            return Result.Failure("insurance_claim.not_found", $"Không tìm thấy hồ sơ bảo hiểm '{command.ClaimId}'.");

        Result actionResult = command.Action switch
        {
            ClaimStatusAction.Approve => claim.Approve(command.ApprovedAmount ?? claim.ClaimAmount, command.Notes),
            ClaimStatusAction.Reject  => claim.Reject(command.Reason ?? "Không đủ điều kiện bồi thường"),
            ClaimStatusAction.Paid    => claim.MarkAsPaid(command.Reference),
            _ => Result.Failure("insurance_claim.invalid_action", "Thao tác không hợp lệ.")
        };

        if (actionResult.IsFailure)
            return actionResult;

        if (command.Action == ClaimStatusAction.Paid && claim.InvoiceId is { } invoiceId && claim.ApprovedAmount > 0)
        {
            var invoice = await _invoices.GetByIdAsync(invoiceId, ct);
            if (invoice is null || invoice.ClinicId != claim.ClinicId || invoice.PatientId != claim.PatientId)
                return Result.Failure("invoice.not_found", "Không tìm thấy hóa đơn hợp lệ cho hồ sơ bảo hiểm.");
            if (invoice.OutstandingAmount > 0)
            {
                var payment = new Payment(
                    Math.Min(claim.ApprovedAmount, invoice.OutstandingAmount),
                    "Insurance",
                    DateTimeOffset.UtcNow,
                    command.Reference ?? claim.ClaimNumber,
                    $"Bảo lãnh bảo hiểm {claim.ProviderName} ({claim.ClaimNumber})");

                var paymentResult = invoice.RegisterPayment(payment);
                if (paymentResult.IsFailure) return paymentResult;
                await _invoices.ReplaceAsync(invoice, ct);
            }
        }

        await _claims.ReplaceAsync(claim, ct);
        return Result.Success();
    }, cancellationToken);
}
