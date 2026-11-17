using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Insurance;

public sealed class InsuranceClaim : AuditableEntity
{
    private readonly List<InsuranceClaimItem> _items = [];

    public InsuranceClaim(
        Guid id,
        Guid patientId,
        Guid clinicId,
        string claimNumber,
        InsuranceType insuranceType,
        string providerName,
        string cardNumber,
        decimal claimAmount,
        string? policyNumber = null,
        decimal? coverageRate = null,
        Guid? invoiceId = null,
        Guid? appointmentId = null,
        string? diagnosis = null,
        string? doctorName = null,
        string? notes = null)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(claimNumber))
            throw new ArgumentException("Claim number is required.", nameof(claimNumber));
        if (string.IsNullOrWhiteSpace(providerName))
            throw new ArgumentException("Insurance provider name is required.", nameof(providerName));
        if (string.IsNullOrWhiteSpace(cardNumber))
            throw new ArgumentException("Insurance card number is required.", nameof(cardNumber));

        PatientId = patientId;
        ClinicId = clinicId;
        ClaimNumber = claimNumber.Trim();
        InsuranceType = insuranceType;
        ProviderName = providerName.Trim();
        CardNumber = cardNumber.Trim();
        ClaimAmount = Math.Max(0, claimAmount);
        PolicyNumber = policyNumber?.Trim();
        CoverageRate = coverageRate;
        InvoiceId = invoiceId;
        AppointmentId = appointmentId;
        Diagnosis = diagnosis?.Trim();
        DoctorName = doctorName?.Trim();
        Notes = notes?.Trim();
        Status = InsuranceClaimStatus.Processing;
        SubmittedAt = DateTimeOffset.UtcNow;
        ApprovedAmount = 0;
        PatientPayAmount = ClaimAmount;
    }

    public Guid PatientId { get; private set; }
    public Guid ClinicId { get; private set; }
    public string ClaimNumber { get; private set; }
    public InsuranceType InsuranceType { get; private set; }
    public string ProviderName { get; private set; }
    public string CardNumber { get; private set; }
    public string? PolicyNumber { get; private set; }
    public decimal? CoverageRate { get; private set; }
    public Guid? InvoiceId { get; private set; }
    public Guid? AppointmentId { get; private set; }
    public decimal ClaimAmount { get; private set; }
    public decimal ApprovedAmount { get; private set; }
    public decimal PatientPayAmount { get; private set; }
    public InsuranceClaimStatus Status { get; private set; }
    public string? Diagnosis { get; private set; }
    public string? DoctorName { get; private set; }
    public string? Notes { get; private set; }
    public string? RejectReason { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }
    public DateTimeOffset? ProcessedAt { get; private set; }

    public IReadOnlyList<InsuranceClaimItem> Items => _items.AsReadOnly();

    public Result AddItem(InsuranceClaimItem item)
    {
        if (Status != InsuranceClaimStatus.Processing)
            return Result.Failure("insurance_claim.invalid_state", "Không thể thêm dịch vụ khi hồ sơ đã xử lý.");

        _items.Add(item);
        ClaimAmount = _items.Sum(i => i.Amount);
        PatientPayAmount = Math.Max(0, ClaimAmount - ApprovedAmount);
        Touch();
        return Result.Success();
    }

    public Result Approve(decimal approvedAmount, string? notes = null)
    {
        if (Status != InsuranceClaimStatus.Processing)
            return Result.Failure("insurance_claim.invalid_state", "Chỉ có thể duyệt hồ sơ đang chờ xử lý.");

        if (approvedAmount <= 0)
            return Result.Failure("insurance_claim.invalid_amount", "Số tiền được duyệt phải lớn hơn 0.");

        if (approvedAmount > ClaimAmount)
            return Result.Failure("insurance_claim.amount_exceeded", "Số tiền được duyệt không thể vượt quá số tiền yêu cầu.");

        ApprovedAmount = approvedAmount;
        PatientPayAmount = Math.Max(0, ClaimAmount - approvedAmount);
        Status = InsuranceClaimStatus.Approved;
        ProcessedAt = DateTimeOffset.UtcNow;
        if (!string.IsNullOrWhiteSpace(notes))
            Notes = notes.Trim();

        Touch();
        return Result.Success();
    }

    public Result Reject(string reason)
    {
        if (Status != InsuranceClaimStatus.Processing)
            return Result.Failure("insurance_claim.invalid_state", "Chỉ có thể từ chối hồ sơ đang chờ xử lý.");

        if (string.IsNullOrWhiteSpace(reason))
            return Result.Failure("insurance_claim.missing_reason", "Vui lòng nhập lý do từ chối bồi thường.");

        RejectReason = reason.Trim();
        Status = InsuranceClaimStatus.Rejected;
        ApprovedAmount = 0;
        PatientPayAmount = ClaimAmount;
        ProcessedAt = DateTimeOffset.UtcNow;

        Touch();
        return Result.Success();
    }

    public Result MarkAsPaid(string? reference = null)
    {
        if (Status != InsuranceClaimStatus.Approved)
            return Result.Failure("insurance_claim.not_approved", "Chỉ có thể xác nhận thanh toán cho hồ sơ đã được duyệt.");

        Status = InsuranceClaimStatus.Paid;
        ProcessedAt = DateTimeOffset.UtcNow;
        if (!string.IsNullOrWhiteSpace(reference))
            Notes = string.IsNullOrWhiteSpace(Notes) ? $"Mã giao dịch: {reference}" : $"{Notes} | Mã GD: {reference}";

        Touch();
        return Result.Success();
    }

    public static InsuranceClaim Rehydrate(
        Guid id,
        Guid patientId,
        Guid clinicId,
        string claimNumber,
        InsuranceType insuranceType,
        string providerName,
        string cardNumber,
        string? policyNumber,
        decimal? coverageRate,
        Guid? invoiceId,
        Guid? appointmentId,
        decimal claimAmount,
        decimal approvedAmount,
        decimal patientPayAmount,
        InsuranceClaimStatus status,
        string? diagnosis,
        string? doctorName,
        string? notes,
        string? rejectReason,
        DateTimeOffset submittedAt,
        DateTimeOffset? processedAt,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        IEnumerable<InsuranceClaimItem> items)
    {
        var claim = new InsuranceClaim(
            id, patientId, clinicId, claimNumber, insuranceType, providerName, cardNumber,
            claimAmount, policyNumber, coverageRate, invoiceId, appointmentId, diagnosis, doctorName, notes)
        {
            ApprovedAmount = approvedAmount,
            PatientPayAmount = patientPayAmount,
            Status = status,
            RejectReason = rejectReason,
            SubmittedAt = submittedAt,
            ProcessedAt = processedAt
        };
        claim._items.AddRange(items);
        claim.SetAuditDates(createdAt, updatedAt);
        return claim;
    }
}
