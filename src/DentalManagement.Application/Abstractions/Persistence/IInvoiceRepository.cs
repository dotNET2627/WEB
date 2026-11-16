using DentalManagement.Domain.Billing;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IInvoiceRepository
{
    Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Invoice>> GetByPatientAsync(Guid patientId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Invoice>> GetByClinicAsync(Guid clinicId, DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken);
    Task<bool> InvoiceNumberExistsAsync(Guid clinicId, string invoiceNumber, CancellationToken cancellationToken);
    Task<string> GenerateNextInvoiceNumberAsync(Guid clinicId, CancellationToken cancellationToken);
    Task AddAsync(Invoice invoice, CancellationToken cancellationToken);
    Task ReplaceAsync(Invoice invoice, CancellationToken cancellationToken);
}
