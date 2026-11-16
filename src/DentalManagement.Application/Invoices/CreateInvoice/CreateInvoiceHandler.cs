using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Billing;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Invoices.CreateInvoice;

public sealed class CreateInvoiceHandler
    : ICommandHandler<CreateInvoiceCommand, Result<Guid>>
{
    private readonly IInvoiceRepository _invoices;
    private readonly ITransactionRunner _tx;

    public CreateInvoiceHandler(IInvoiceRepository invoices, ITransactionRunner tx)
    {
        _invoices = invoices;
        _tx = tx;
    }

    public async Task<Result<Guid>> Handle(CreateInvoiceCommand command, CancellationToken cancellationToken)
    {
        if (command.Lines.Count == 0)
            return Result<Guid>.Failure("invoice.no_lines", "Hóa đơn phải có ít nhất một dòng dịch vụ.");

        // Auto-generate invoice number
        var invoiceNumber = await _invoices.GenerateNextInvoiceNumberAsync(command.ClinicId, cancellationToken);

        var invoice = new Invoice(
            Guid.NewGuid(),
            command.PatientId,
            command.ClinicId,
            invoiceNumber,
            command.AppointmentId,
            command.Notes);

        foreach (var req in command.Lines)
        {
            var addResult = invoice.AddLine(new InvoiceLine(
                req.Description,
                req.Quantity,
                req.UnitPrice,
                req.ServiceId,
                req.ToothNumber));

            if (addResult.IsFailure) return Result<Guid>.Failure(addResult.Error!.Code, addResult.Error.Message);
        }

        if (command.DiscountAmount > 0 || command.DiscountPercent > 0)
        {
            var discResult = invoice.SetDiscount(command.DiscountAmount, command.DiscountPercent);
            if (discResult.IsFailure) return Result<Guid>.Failure(discResult.Error!.Code, discResult.Error.Message);
        }

        await _tx.RunAsync(async () => await _invoices.AddAsync(invoice, cancellationToken), cancellationToken);
        return Result<Guid>.Success(invoice.Id);
    }
}
