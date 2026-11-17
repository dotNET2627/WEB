namespace DentalManagement.Application.Invoices.VietQr;

public sealed class VietQrOptions
{
    public const string SectionName = "VietQr";

    public string DefaultBankBin { get; set; } = "970422"; // MBBank
    public string DefaultBankName { get; set; } = "MBBank (Ngân hàng Quân Đội)";
    public string DefaultAccountNumber { get; set; } = "0987654321";
    public string DefaultAccountName { get; set; } = "NHA KHOA DENTAL";
    public string Template { get; set; } = "compact2";
}
