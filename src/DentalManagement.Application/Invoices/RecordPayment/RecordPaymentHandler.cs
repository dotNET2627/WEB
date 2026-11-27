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

    public Task<Result> Handle(RecordPaymentCommand command, CancellationToken cancellationToken) =>
        _tx.ExecuteAsync(async ct =>
    {
        var invoice = await _invoices.GetByIdAsync(command.InvoiceId, ct);
        if (invoice is null || invoice.ClinicId != command.ClinicId)
            return Result.Failure("invoice.not_found", $"Không tìm thấy hóa đơn '{command.InvoiceId}'.");

        var payment = new Payment(command.Amount, command.Method, DateTimeOffset.UtcNow, command.Reference, command.Note);
        var result  = invoice.RegisterPayment(payment);
        if (result.IsFailure) return result;

        await _invoices.ReplaceAsync(invoice, ct);
        return Result.Success();
    }, cancellationToken);
}
