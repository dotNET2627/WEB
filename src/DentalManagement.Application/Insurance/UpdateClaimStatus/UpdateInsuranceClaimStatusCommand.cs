namespace DentalManagement.Application.Insurance.UpdateClaimStatus;

public enum ClaimStatusAction
{
    Approve,
    Reject,
    Paid
}

public sealed record UpdateInsuranceClaimStatusCommand(
    Guid ClinicId,
    Guid ClaimId,
    ClaimStatusAction Action,
    decimal? ApprovedAmount = null,
    string? Notes = null,
    string? Reason = null,
    string? Reference = null);
