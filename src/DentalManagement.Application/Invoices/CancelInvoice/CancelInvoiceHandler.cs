using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Invoices.CancelInvoice;

public sealed class CancelInvoiceHandler
    : ICommandHandler<CancelInvoiceCommand, Result>
{
    private readonly IInvoiceRepository _invoices;
    private readonly ITransactionRunner _tx;

    public CancelInvoiceHandler(IInvoiceRepository invoices, ITransactionRunner tx)
    {
        _invoices = invoices;
        _tx = tx;
    }

    public async Task<Result> Handle(CancelInvoiceCommand command, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetByIdAsync(command.InvoiceId, cancellationToken);
        if (invoice is null)
            return Result.Failure("invoice.not_found", $"Không tìm thấy hóa đơn '{command.InvoiceId}'.");

        var result = invoice.Cancel();
        if (result.IsFailure) return result;

        await _tx.RunAsync(async () => await _invoices.ReplaceAsync(invoice, cancellationToken), cancellationToken);
        return Result.Success();
    }
}
