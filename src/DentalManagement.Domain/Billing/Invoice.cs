using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Billing;

public enum InvoiceStatus
{
    Unpaid,
    PartiallyPaid,
    Paid,
    Cancelled
}

public sealed class Invoice : AuditableEntity
{
    private readonly List<InvoiceLine> _lines = [];
    private readonly List<Payment> _payments = [];

    public Invoice(Guid id, Guid patientId, Guid clinicId, string invoiceNumber)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(invoiceNumber))
        {
            throw new ArgumentException("Invoice number is required.", nameof(invoiceNumber));
        }

        PatientId = patientId;
        ClinicId = clinicId;
        InvoiceNumber = invoiceNumber.Trim();
    }

    public Guid PatientId { get; private set; }
    public Guid ClinicId { get; private set; }
    public string InvoiceNumber { get; private set; }
    public InvoiceStatus Status { get; private set; } = InvoiceStatus.Unpaid;
    public decimal DiscountAmount { get; private set; }
    public decimal TotalAmount => _lines.Sum(line => line.Amount) - DiscountAmount;
    public decimal PaidAmount => _payments.Sum(payment => payment.Amount);
    public decimal OutstandingAmount => Math.Max(0, TotalAmount - PaidAmount);
    public IReadOnlyCollection<InvoiceLine> Lines => _lines.AsReadOnly();
    public IReadOnlyCollection<Payment> Payments => _payments.AsReadOnly();

    public Result AddLine(InvoiceLine line)
    {
        if (Status == InvoiceStatus.Cancelled)
        {
            return Result.Failure("invoice.cancelled", "A cancelled invoice cannot be changed.");
        }

        _lines.Add(line);
        Touch();
        return Result.Success();
    }

    public Result RegisterPayment(Payment payment)
    {
        if (Status == InvoiceStatus.Cancelled)
        {
            return Result.Failure("invoice.cancelled", "A cancelled invoice cannot receive payments.");
        }

        if (payment.Amount <= 0 || payment.Amount > OutstandingAmount)
        {
            return Result.Failure("invoice.invalid_payment", "Payment amount must be positive and not exceed the outstanding amount.");
        }

        _payments.Add(payment);
        Status = OutstandingAmount == 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
        Touch();
        return Result.Success();
    }
}

public sealed record InvoiceLine(string Description, int Quantity, decimal UnitPrice)
{
    public decimal Amount => Quantity * UnitPrice;
}

public sealed record Payment(decimal Amount, string Method, DateTimeOffset PaidAt, string? Reference = null);
