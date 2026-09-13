using DentalManagement.Domain.Billing;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IInvoiceRepository
{
    Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> InvoiceNumberExistsAsync(Guid clinicId, string invoiceNumber, CancellationToken cancellationToken);
    Task AddAsync(Invoice invoice, CancellationToken cancellationToken);
    Task ReplaceAsync(Invoice invoice, CancellationToken cancellationToken);
}
