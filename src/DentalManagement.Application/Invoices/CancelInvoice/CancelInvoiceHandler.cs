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

    public Task<Result> Handle(CancelInvoiceCommand command, CancellationToken cancellationToken) =>
        _tx.ExecuteAsync(async ct =>
    {
        var invoice = await _invoices.GetByIdAsync(command.InvoiceId, ct);
        if (invoice is null || invoice.ClinicId != command.ClinicId)
            return Result.Failure("invoice.not_found", $"Không tìm thấy hóa đơn '{command.InvoiceId}'.");

        var result = invoice.Cancel();
        if (result.IsFailure) return result;

        await _invoices.ReplaceAsync(invoice, ct);
        return Result.Success();
    }, cancellationToken);
}
