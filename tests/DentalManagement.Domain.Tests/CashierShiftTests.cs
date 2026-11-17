using DentalManagement.Domain.Billing;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class CashierShiftTests
{
    [Fact]
    public void OpenShift_InitializesWithZeroSystemAmountsAndOpenStatus()
    {
        var shift = new CashierShift(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Nguyen Van Thu Ngan",
            "CA-20261118-01",
            1000000m);

        Assert.Equal(ShiftStatus.Open, shift.Status);
        Assert.True(shift.IsOpen);
        Assert.Equal(1000000m, shift.OpeningCash);
        Assert.Equal(0, shift.SystemCashAmount);
        Assert.Null(shift.ActualCashAmount);
        Assert.Null(shift.CashDifference);
    }

    [Fact]
    public void CloseShift_CalculatesDifferenceAccurately()
    {
        var shift = new CashierShift(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Nguyen Van Thu Ngan",
            "CA-20261118-01",
            1000000m); // 1,000,000 đầu ca

        // System recorded: Cash 2,500,000, Transfer 3,000,000, Card 500,000
        // Expected total cash in drawer = 1,000,000 + 2,500,000 = 3,500,000
        // Cashier actually counts 3,500,000 -> Diff = 0
        var result = shift.CloseShift(
            actualCash: 3500000m,
            actualTransfer: 3000000m,
            actualCard: 500000m,
            systemCash: 2500000m,
            systemTransfer: 3000000m,
            systemCard: 500000m,
            systemInsurance: 0m,
            notes: "Khớp sổ 100%");

        Assert.True(result.IsSuccess);
        Assert.Equal(ShiftStatus.Closed, shift.Status);
        Assert.Equal(0m, shift.CashDifference);
        Assert.NotNull(shift.ClosedAt);
    }

    [Fact]
    public void CloseShift_WithCashShortage_CalculatesNegativeDifference()
    {
        var shift = new CashierShift(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Nguyen Van Thu Ngan",
            "CA-20261118-02",
            1000000m);

        // Expected in drawer = 1,000,000 + 2,000,000 = 3,000,000
        // Counted = 2,900,000 (Shortage of 100,000)
        var result = shift.CloseShift(
            actualCash: 2900000m,
            actualTransfer: 0m,
            actualCard: 0m,
            systemCash: 2000000m,
            systemTransfer: 0m,
            systemCard: 0m,
            systemInsurance: 0m,
            notes: "Thiếu 100k do thối nhầm tiền cho khách");

        Assert.True(result.IsSuccess);
        Assert.Equal(-100000m, shift.CashDifference);
    }
}
