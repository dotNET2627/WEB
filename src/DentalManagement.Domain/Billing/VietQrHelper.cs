using System.Text;
using System.Text.RegularExpressions;

namespace DentalManagement.Domain.Billing;

/// <summary>
/// Generates standard VietQR NAPAS 247 payload and QuickLink image URL
/// in compliance with EMVCo QR Code Specification and NAPAS guidelines.
/// </summary>
public static class VietQrHelper
{
    private const string NapasGuid = "A000000727";
    private const string ServiceCodeTransfer = "QRIBFTTA"; // Quick Response Interbank Fast Transfer to Account

    /// <summary>
    /// Formats a Tag-Length-Value (TLV) string according to EMVCo QR specification.
    /// </summary>
    public static string FormatTlv(string tag, string value)
    {
        return $"{tag}{value.Length:D2}{value}";
    }

    /// <summary>
    /// Removes Vietnamese diacritics and special characters to ensure 100% bank app compatibility.
    /// </summary>
    public static string SanitizeMemo(string? memo, int maxLength = 25)
    {
        if (string.IsNullOrWhiteSpace(memo))
            return string.Empty;

        // Normalize and remove accents
        var normalized = memo.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (char c in normalized)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        string result = sb.ToString().Normalize(NormalizationForm.FormC);
        // Keep only alphanumeric and spaces
        result = Regex.Replace(result, @"[^a-zA-Z0-9\s-]", " ").Trim();
        result = Regex.Replace(result, @"\s+", " ");

        return result.Length > maxLength ? result[..maxLength].Trim() : result;
    }

    /// <summary>
    /// Calculates CRC16-CCITT (polynomial 0x1021, init 0xFFFF) as specified in EMVCo Book 4.
    /// </summary>
    public static string CalculateCrc16(string input)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(input);
        ushort crc = 0xFFFF;
        const ushort polynomial = 0x1021;

        foreach (byte b in bytes)
        {
            for (int i = 0; i < 8; i++)
            {
                bool bit = ((b >> (7 - i)) & 1) == 1;
                bool c15 = ((crc >> 15) & 1) == 1;
                crc = (ushort)(crc << 1);
                if (c15 ^ bit)
                {
                    crc ^= polynomial;
                }
            }
        }

        return crc.ToString("X4");
    }

    /// <summary>
    /// Generates standard EMVCo VietQR NAPAS 247 string payload.
    /// </summary>
    public static string GenerateEmvcoPayload(
        string bankBin,
        string accountNumber,
        decimal amount,
        string memo)
    {
        var cleanBin = bankBin.Trim();
        var cleanAcc = accountNumber.Trim();
        var cleanMemo = SanitizeMemo(memo);

        var sb = new StringBuilder();

        // Tag 00: Payload Format Indicator (01)
        sb.Append(FormatTlv("00", "01"));

        // Tag 01: Point of Initiation Method (12 = Dynamic with amount, 11 = Static)
        sb.Append(FormatTlv("01", amount > 0 ? "12" : "11"));

        // Tag 38: Merchant Account Information (NAPAS)
        var subTag00 = FormatTlv("00", NapasGuid);
        var beneficiaryOrg = FormatTlv("00", cleanBin) + FormatTlv("01", cleanAcc);
        var subTag01 = FormatTlv("01", beneficiaryOrg);
        var subTag02 = FormatTlv("02", ServiceCodeTransfer);
        var tag38Value = subTag00 + subTag01 + subTag02;
        sb.Append(FormatTlv("38", tag38Value));

        // Tag 53: Transaction Currency (704 = VND)
        sb.Append(FormatTlv("53", "704"));

        // Tag 54: Transaction Amount
        if (amount > 0)
        {
            long integerAmount = (long)Math.Round(amount, 0);
            sb.Append(FormatTlv("54", integerAmount.ToString()));
        }

        // Tag 58: Country Code (VN)
        sb.Append(FormatTlv("58", "VN"));

        // Tag 62: Additional Data Field (Memo)
        if (!string.IsNullOrEmpty(cleanMemo))
        {
            var subTag08 = FormatTlv("08", cleanMemo);
            sb.Append(FormatTlv("62", subTag08));
        }

        // Tag 63: CRC16
        sb.Append("6304");
        var crc = CalculateCrc16(sb.ToString());
        sb.Append(crc);

        return sb.ToString();
    }

    /// <summary>
    /// Generates official VietQR QuickLink image URL.
    /// </summary>
    public static string GenerateQuickLinkUrl(
        string bankBin,
        string accountNumber,
        decimal amount,
        string memo,
        string accountName,
        string template = "compact2")
    {
        var cleanBin = bankBin.Trim();
        var cleanAcc = accountNumber.Trim();
        long integerAmount = (long)Math.Round(Math.Max(0, amount), 0);
        var cleanMemo = Uri.EscapeDataString(SanitizeMemo(memo));
        var cleanName = Uri.EscapeDataString(accountName.Trim().ToUpperInvariant());

        return $"https://img.vietqr.io/image/{cleanBin}-{cleanAcc}-{template}.png?amount={integerAmount}&addInfo={cleanMemo}&accountName={cleanName}";
    }
}
