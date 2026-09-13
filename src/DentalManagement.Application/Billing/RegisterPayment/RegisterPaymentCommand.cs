namespace DentalManagement.Application.Billing.RegisterPayment;

public sealed record RegisterPaymentCommand(
    Guid InvoiceId,
    decimal Amount,
    string Method,
    string? Reference);
