using DentalManagement.Domain.Billing;
using Xunit;

namespace DentalManagement.Domain.Tests;

public class VietQrHelperTests
{
    [Fact]
    public void CalculateCrc16_WithStandardVector_ReturnsExpectedCrc()
    {
        // Standard CCITT-FALSE for "123456789" is 0x29B1
        var crc = VietQrHelper.CalculateCrc16("123456789");
        Assert.Equal("29B1", crc);
    }

    [Fact]
    public void SanitizeMemo_RemovesDiacriticsAndSpecialChars()
    {
        var memo = "Thanh toán hoá đơn HD-2026-0001 (răng số 11)";
        var sanitized = VietQrHelper.SanitizeMemo(memo, 25);

        Assert.DoesNotContain("á", sanitized);
        Assert.DoesNotContain("oá", sanitized);
        Assert.DoesNotContain("đ", sanitized);
        Assert.True(sanitized.Length <= 25);
    }

    [Fact]
    public void GenerateEmvcoPayload_ProducesValidNapasStructure()
    {
        var payload = VietQrHelper.GenerateEmvcoPayload(
            bankBin: "970422",
            accountNumber: "0123456789",
            amount: 500000m,
            memo: "TT HD-202611-0001");

        Assert.StartsWith("000201", payload);
        Assert.Contains("010212", payload);
        Assert.Contains("A000000727", payload); // NAPAS GUID
        Assert.Contains("970422", payload);     // MBBank BIN
        Assert.Contains("0123456789", payload); // Account number
        Assert.Contains("5303704", payload);    // VND
        Assert.Contains("5406500000", payload); // 500,000 VND
        Assert.Contains("5802VN", payload);     // Country VN
        Assert.Contains("6304", payload);       // CRC Tag
        Assert.Equal(4, payload[^4..].Length);  // 4-char CRC
    }

    [Fact]
    public void GenerateQuickLinkUrl_ProducesValidVietQrUrl()
    {
        var url = VietQrHelper.GenerateQuickLinkUrl(
            bankBin: "970422",
            accountNumber: "0123456789",
            amount: 1500000m,
            memo: "TT HD-001",
            accountName: "Nha Khoa Dental");

        Assert.StartsWith("https://img.vietqr.io/image/970422-0123456789-compact2.png", url);
        Assert.Contains("amount=1500000", url);
        Assert.Contains("accountName=NHA%20KHOA%20DENTAL", url);
    }
}
