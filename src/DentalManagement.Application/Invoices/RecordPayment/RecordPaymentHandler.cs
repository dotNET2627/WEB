using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Billing;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Invoices.RecordPayment;

public sealed class RecordPaymentHandler
    : ICommandHandler<RecordPaymentCommand, Result>
{
    private readonly IInvoiceRepository _invoices;
    private readonly ITransactionRunner _tx;

    public RecordPaymentHandler(IInvoiceRepository invoices, ITransactionRunner tx)
    {
        _invoices = invoices;
        _tx = tx;
    }

    public async Task<Result> Handle(RecordPaymentCommand command, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetByIdAsync(command.InvoiceId, cancellationToken);
        if (invoice is null)
            return Result.Failure("invoice.not_found", $"Không tìm thấy hóa đơn '{command.InvoiceId}'.");

        var payment = new Payment(command.Amount, command.Method, DateTimeOffset.UtcNow, command.Reference, command.Note);
        var result  = invoice.RegisterPayment(payment);
        if (result.IsFailure) return result;

        await _tx.RunAsync(async () => await _invoices.ReplaceAsync(invoice, cancellationToken), cancellationToken);
        return Result.Success();
    }
}
