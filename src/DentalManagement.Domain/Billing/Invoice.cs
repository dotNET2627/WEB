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

    public Invoice(
        Guid id,
        Guid patientId,
        Guid clinicId,
        string invoiceNumber,
        Guid? appointmentId = null,
        string? notes = null)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Invoice number is required.", nameof(invoiceNumber));

        PatientId = patientId;
        ClinicId = clinicId;
        InvoiceNumber = invoiceNumber.Trim();
        AppointmentId = appointmentId;
        Notes = notes?.Trim();
        IssuedAt = DateTimeOffset.UtcNow;
    }

    public Guid PatientId { get; private set; }
    public Guid ClinicId { get; private set; }
    public string InvoiceNumber { get; private set; }

    /// <summary>Optional link to the appointment this invoice was generated from.</summary>
    public Guid? AppointmentId { get; private set; }

    public InvoiceStatus Status { get; private set; } = InvoiceStatus.Unpaid;
    public decimal DiscountAmount { get; private set; }
    public decimal DiscountPercent { get; private set; }
    public string? Notes { get; private set; }
    public DateTimeOffset IssuedAt { get; private set; }

    public decimal SubTotal => _lines.Sum(l => l.Amount);
    public decimal DiscountValue => DiscountPercent > 0
        ? Math.Round(SubTotal * DiscountPercent / 100, 2)
        : DiscountAmount;
    public decimal TotalAmount => Math.Max(0, SubTotal - DiscountValue);
    public decimal PaidAmount => _payments.Sum(p => p.Amount);
    public decimal OutstandingAmount => Math.Max(0, TotalAmount - PaidAmount);

    public IReadOnlyList<InvoiceLine> Lines => _lines.AsReadOnly();
    public IReadOnlyList<Payment> Payments => _payments.AsReadOnly();

    // ── Mutations ─────────────────────────────────────────────────────────────

    public Result AddLine(InvoiceLine line)
    {
        if (Status == InvoiceStatus.Cancelled)
            return Result.Failure("invoice.cancelled", "Hóa đơn đã hủy không thể chỉnh sửa.");
        if (Status == InvoiceStatus.Paid)
            return Result.Failure("invoice.paid", "Hóa đơn đã thanh toán không thể thêm dòng.");

        _lines.Add(line);
        Touch();
        return Result.Success();
    }

    public Result SetDiscount(decimal discountAmount = 0, decimal discountPercent = 0)
    {
        if (Status == InvoiceStatus.Cancelled)
            return Result.Failure("invoice.cancelled", "Hóa đơn đã hủy không thể chỉnh sửa.");
        if (discountAmount < 0 || discountPercent < 0 || discountPercent > 100)
            return Result.Failure("invoice.invalid_discount", "Giá trị chiết khấu không hợp lệ.");
        if (discountAmount > 0 && discountPercent > 0)
            return Result.Failure("invoice.invalid_discount", "Chỉ được dùng một trong hai: chiết khấu tiền mặt hoặc phần trăm.");

        DiscountAmount = discountAmount;
        DiscountPercent = discountPercent;
        Touch();
        return Result.Success();
    }

    public Result RegisterPayment(Payment payment)
    {
        if (Status == InvoiceStatus.Cancelled)
            return Result.Failure("invoice.cancelled", "Hóa đơn đã hủy không thể nhận thanh toán.");
        if (Status == InvoiceStatus.Paid)
            return Result.Failure("invoice.paid", "Hóa đơn đã thanh toán đầy đủ.");
        if (payment.Amount <= 0)
            return Result.Failure("invoice.invalid_payment", "Số tiền thanh toán phải lớn hơn 0.");
        if (payment.Amount > OutstandingAmount)
            return Result.Failure("invoice.overpayment",
                $"Số tiền ({payment.Amount:N0}đ) vượt quá còn lại ({OutstandingAmount:N0}đ).");

        _payments.Add(payment);
        Status = OutstandingAmount <= 0.01m ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
        Touch();
        return Result.Success();
    }

    public Result Cancel()
    {
        if (Status == InvoiceStatus.Paid)
            return Result.Failure("invoice.paid", "Không thể hủy hóa đơn đã thanh toán đầy đủ.");
        if (Status == InvoiceStatus.Cancelled)
            return Result.Failure("invoice.cancelled", "Hóa đơn đã được hủy rồi.");

        Status = InvoiceStatus.Cancelled;
        Touch();
        return Result.Success();
    }

    public static Invoice Rehydrate(
        Guid id,
        Guid patientId,
        Guid clinicId,
        string invoiceNumber,
        Guid? appointmentId,
        InvoiceStatus status,
        decimal discountAmount,
        decimal discountPercent,
        string? notes,
        DateTimeOffset issuedAt,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        IEnumerable<InvoiceLine> lines,
        IEnumerable<Payment> payments)
    {
        var inv = new Invoice(id, patientId, clinicId, invoiceNumber, appointmentId, notes)
        {
            Status = status,
            DiscountAmount = discountAmount,
            DiscountPercent = discountPercent,
            IssuedAt = issuedAt
        };
        inv._lines.AddRange(lines);
        inv._payments.AddRange(payments);
        inv.SetAuditDates(createdAt, updatedAt);
        return inv;
    }
}

/// <summary>One line in an invoice — maps to a service, treatment step, or free-text item.</summary>
public sealed record InvoiceLine(
    string Description,
    int Quantity,
    decimal UnitPrice,
    Guid? ServiceId = null,
    string? ToothNumber = null)
{
    public decimal Amount => Quantity * UnitPrice;
}

public sealed record Payment(
    decimal Amount,
    string Method,
    DateTimeOffset PaidAt,
    string? Reference = null);
