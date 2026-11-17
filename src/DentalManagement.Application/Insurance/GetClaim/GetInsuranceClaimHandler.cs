using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Insurance.GetClaim;

public sealed class GetInsuranceClaimHandler
    : IQueryHandler<GetInsuranceClaimQuery, Result<InsuranceClaimDto>>
{
    private readonly IInsuranceClaimRepository _claims;
    private readonly IPatientRepository _patients;
    private readonly IInvoiceRepository _invoices;

    public GetInsuranceClaimHandler(
        IInsuranceClaimRepository claims,
        IPatientRepository patients,
        IInvoiceRepository invoices)
    {
        _claims = claims;
        _patients = patients;
        _invoices = invoices;
    }

    public async Task<Result<InsuranceClaimDto>> Handle(GetInsuranceClaimQuery query, CancellationToken cancellationToken)
    {
        var claim = await _claims.GetByIdAsync(query.ClaimId, cancellationToken);
        if (claim is null)
            return Result<InsuranceClaimDto>.Failure("insurance_claim.not_found", $"Không tìm thấy hồ sơ bảo hiểm '{query.ClaimId}'.");

        var patient = await _patients.GetByIdAsync(claim.PatientId, cancellationToken);
        var patientName = patient?.FullName ?? "–";
        var patientCode = patient?.PatientCode;
        var patientPhone = patient?.PhoneNumber;

        string? invoiceNumber = null;
        if (claim.InvoiceId.HasValue)
        {
            var invoice = await _invoices.GetByIdAsync(claim.InvoiceId.Value, cancellationToken);
            invoiceNumber = invoice?.InvoiceNumber;
        }

        var items = claim.Items.Select(i => new InsuranceClaimItemDto(
            i.Description,
            i.Quantity,
            i.UnitPrice,
            i.Amount,
            i.ApprovedAmount,
            i.ToothNumber,
            i.ServiceId)).ToList();

        var dto = new InsuranceClaimDto(
            claim.Id,
            claim.PatientId,
            patientName,
            patientCode,
            patientPhone,
            claim.ClinicId,
            claim.ClaimNumber,
            claim.InsuranceType.ToString(),
            claim.ProviderName,
            claim.CardNumber,
            claim.PolicyNumber,
            claim.CoverageRate,
            claim.InvoiceId,
            invoiceNumber,
            claim.AppointmentId,
            claim.ClaimAmount,
            claim.ApprovedAmount,
            claim.PatientPayAmount,
            claim.Status.ToString(),
            claim.Diagnosis,
            claim.DoctorName,
            claim.Notes,
            claim.RejectReason,
            claim.SubmittedAt,
            claim.ProcessedAt,
            claim.CreatedAt,
            items);

        return Result<InsuranceClaimDto>.Success(dto);
    }
}
