using DentalManagement.Domain.Insurance;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class InsuranceClaimDocumentMapper
{
    public static InsuranceClaimDocument ToDocument(InsuranceClaim claim) => new()
    {
        Id = claim.Id,
        PatientId = claim.PatientId,
        ClinicId = claim.ClinicId,
        ClaimNumber = claim.ClaimNumber,
        InsuranceType = claim.InsuranceType.ToString(),
        ProviderName = claim.ProviderName,
        CardNumber = claim.CardNumber,
        PolicyNumber = claim.PolicyNumber,
        CoverageRate = claim.CoverageRate,
        InvoiceId = claim.InvoiceId,
        AppointmentId = claim.AppointmentId,
        ClaimAmount = claim.ClaimAmount,
        ApprovedAmount = claim.ApprovedAmount,
        PatientPayAmount = claim.PatientPayAmount,
        Status = claim.Status.ToString(),
        Diagnosis = claim.Diagnosis,
        DoctorName = claim.DoctorName,
        Notes = claim.Notes,
        RejectReason = claim.RejectReason,
        SubmittedAt = claim.SubmittedAt,
        ProcessedAt = claim.ProcessedAt,
        CreatedAt = claim.CreatedAt,
        UpdatedAt = claim.UpdatedAt,
        Items = claim.Items.Select(i => new InsuranceClaimItemDocument(
            i.Description, i.Quantity, i.UnitPrice, i.ApprovedAmount, i.ToothNumber, i.ServiceId)).ToList()
    };

    public static InsuranceClaim ToDomain(InsuranceClaimDocument doc)
    {
        var insuranceType = Enum.TryParse<InsuranceType>(doc.InsuranceType, out var it) ? it : InsuranceType.SocialHealth;
        var status = Enum.TryParse<InsuranceClaimStatus>(doc.Status, out var s) ? s : InsuranceClaimStatus.Processing;

        var items = doc.Items.Select(i => new InsuranceClaimItem(
            i.Description, i.Quantity, i.UnitPrice, i.ApprovedAmount, i.ToothNumber, i.ServiceId));

        return InsuranceClaim.Rehydrate(
            doc.Id,
            doc.PatientId,
            doc.ClinicId,
            doc.ClaimNumber,
            insuranceType,
            doc.ProviderName,
            doc.CardNumber,
            doc.PolicyNumber,
            doc.CoverageRate,
            doc.InvoiceId,
            doc.AppointmentId,
            doc.ClaimAmount,
            doc.ApprovedAmount,
            doc.PatientPayAmount,
            status,
            doc.Diagnosis,
            doc.DoctorName,
            doc.Notes,
            doc.RejectReason,
            doc.SubmittedAt,
            doc.ProcessedAt,
            doc.CreatedAt,
            doc.UpdatedAt,
            items);
    }
}
