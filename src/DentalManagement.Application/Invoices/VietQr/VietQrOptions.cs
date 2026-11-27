namespace DentalManagement.Application.Invoices.VietQr;

public sealed class VietQrOptions
{
    public const string SectionName = "VietQr";

    public string DefaultBankBin { get; set; } = string.Empty;
    public string DefaultBankName { get; set; } = string.Empty;
    public string DefaultAccountNumber { get; set; } = string.Empty;
    public string DefaultAccountName { get; set; } = string.Empty;
    public string Template { get; set; } = "compact2";
}
