namespace DentalManagement.Domain.Promotions;

public enum DiscountType
{
    Percentage = 1,
    FixedAmount = 2
}

public enum DiscountScope
{
    All = 1,
    SpecificServices = 2,
    SpecificCategories = 3
}
