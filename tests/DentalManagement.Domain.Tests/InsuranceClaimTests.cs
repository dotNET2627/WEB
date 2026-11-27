using DentalManagement.Domain.Insurance;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class InsuranceClaimTests
{
    [Fact]
    public void CreateClaim_InitializesWithProcessingStatus()
    {
        var claim = new InsuranceClaim(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "BH-202611-0001",
            InsuranceType.SocialHealth,
            "Bảo hiểm Xã hội TP.HCM",
            "DN4791234567890",
            1000000m);

        Assert.Equal(InsuranceClaimStatus.Processing, claim.Status);
        Assert.Equal(1000000m, claim.ClaimAmount);
        Assert.Equal(0, claim.ApprovedAmount);
        Assert.Equal(1000000m, claim.PatientPayAmount);
    }

    [Fact]
    public void ApproveClaim_UpdatesApprovedAmountAndPatientPayAmount()
    {
        var claim = new InsuranceClaim(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "BH-202611-0001",
            InsuranceType.SocialHealth,
            "Bảo hiểm Xã hội TP.HCM",
            "DN4791234567890",
            1000000m);

        var result = claim.Approve(800000m, "Duyệt đúng tuyến 80%");

        Assert.True(result.IsSuccess);
        Assert.Equal(InsuranceClaimStatus.Approved, claim.Status);
        Assert.Equal(800000m, claim.ApprovedAmount);
        Assert.Equal(200000m, claim.PatientPayAmount);
        Assert.Equal("Duyệt đúng tuyến 80%", claim.Notes);
    }

    [Fact]
    public void RejectClaim_SetsStatusToRejectedAndClearsApproved()
    {
        var claim = new InsuranceClaim(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "BH-202611-0002",
            InsuranceType.Private,
            "Bảo Việt",
            "BV99887766",
            500000m);

        var result = claim.Reject("Dịch vụ thẩm mỹ không thuộc phạm vi bảo hiểm");

        Assert.True(result.IsSuccess);
        Assert.Equal(InsuranceClaimStatus.Rejected, claim.Status);
        Assert.Equal(0, claim.ApprovedAmount);
        Assert.Equal("Dịch vụ thẩm mỹ không thuộc phạm vi bảo hiểm", claim.RejectReason);
    }

    [Fact]
    public void MarkAsPaid_RequiresApprovedStatus()
    {
        var claim = new InsuranceClaim(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "BH-202611-0003",
            InsuranceType.Private,
            "PVI Care",
            "PVI123456",
            500000m);

        // Cannot mark as paid while processing
        var failResult = claim.MarkAsPaid("REF-001");
        Assert.True(failResult.IsFailure);

        // Approve then mark as paid
        claim.Approve(500000m);
        var successResult = claim.MarkAsPaid("REF-001");
        Assert.True(successResult.IsSuccess);
        Assert.Equal(InsuranceClaimStatus.Paid, claim.Status);
    }
}
