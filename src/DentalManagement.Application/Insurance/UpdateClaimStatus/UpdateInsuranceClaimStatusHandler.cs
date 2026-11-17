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

    public async Task<Result> Handle(UpdateInsuranceClaimStatusCommand command, CancellationToken cancellationToken)
    {
        var claim = await _claims.GetByIdAsync(command.ClaimId, cancellationToken);
        if (claim is null)
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

        await _tx.RunAsync(async () =>
        {
            await _claims.ReplaceAsync(claim, cancellationToken);

            // If claim is marked as paid by insurance and linked to an invoice, record payment on invoice
            if (command.Action == ClaimStatusAction.Paid && claim.InvoiceId.HasValue && claim.ApprovedAmount > 0)
            {
                var invoice = await _invoices.GetByIdAsync(claim.InvoiceId.Value, cancellationToken);
                if (invoice is not null && invoice.OutstandingAmount > 0)
                {
                    var payAmount = Math.Min(claim.ApprovedAmount, invoice.OutstandingAmount);
                    var payment = new Payment(
                        payAmount,
                        "Insurance",
                        DateTimeOffset.UtcNow,
                        command.Reference ?? claim.ClaimNumber,
                        $"Bảo lãnh bảo hiểm {claim.ProviderName} ({claim.ClaimNumber})");

                    invoice.RegisterPayment(payment);
                    await _invoices.ReplaceAsync(invoice, cancellationToken);
                }
            }
        }, cancellationToken);

        return Result.Success();
    }
}
