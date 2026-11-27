using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Promotions;

public sealed class DiscountPromo : AuditableEntity
{
    private readonly List<Guid> _applicableServiceIds = [];
    private readonly List<Guid> _applicableCategoryIds = [];

    public DiscountPromo(
        Guid id,
        string code,
        string title,
        DiscountType discountType,
        decimal discountValue,
        DateTimeOffset startDate,
        DateTimeOffset? endDate = null,
        decimal? maxDiscountAmount = null,
        decimal? minOrderAmount = null,
        int? usageLimit = null,
        DiscountScope scope = DiscountScope.All,
        IEnumerable<Guid>? applicableServiceIds = null,
        IEnumerable<Guid>? applicableCategoryIds = null,
        string? description = null,
        bool isActive = true)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Mã khuyến mãi không được để trống.", nameof(code));
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Tiêu đề chương trình không được để trống.", nameof(title));
        }

        if (discountValue <= 0)
        {
            throw new ArgumentException("Giá trị giảm giá phải lớn hơn 0.", nameof(discountValue));
        }

        if (discountType == DiscountType.Percentage && discountValue > 100)
        {
            throw new ArgumentException("Giảm giá theo phần trăm không được vượt quá 100%.", nameof(discountValue));
        }

        if (maxDiscountAmount is < 0)
        {
            throw new ArgumentException("Mức giảm tối đa không được âm.", nameof(maxDiscountAmount));
        }

        if (minOrderAmount is < 0)
        {
            throw new ArgumentException("Giá trị đơn hàng tối thiểu không được âm.", nameof(minOrderAmount));
        }

        if (usageLimit is <= 0)
        {
            throw new ArgumentException("Giới hạn số lượt dùng phải lớn hơn 0.", nameof(usageLimit));
        }

        if (endDate.HasValue && endDate.Value < startDate)
        {
            throw new ArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.", nameof(endDate));
        }

        Code = code.Trim().ToUpperInvariant();
        Title = title.Trim();
        DiscountType = discountType;
        DiscountValue = discountValue;
        StartDate = startDate;
        EndDate = endDate;
        MaxDiscountAmount = maxDiscountAmount;
        MinOrderAmount = minOrderAmount;
        UsageLimit = usageLimit;
        UsedCount = 0;
        Scope = scope;
        Description = description?.Trim();
        IsActive = isActive;

        if (applicableServiceIds != null)
        {
            _applicableServiceIds.AddRange(applicableServiceIds.Distinct());
        }

        if (applicableCategoryIds != null)
        {
            _applicableCategoryIds.AddRange(applicableCategoryIds.Distinct());
        }
    }

    public string Code { get; private set; }
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public DiscountType DiscountType { get; private set; }
    public decimal DiscountValue { get; private set; }
    public decimal? MaxDiscountAmount { get; private set; }
    public decimal? MinOrderAmount { get; private set; }
    public DateTimeOffset StartDate { get; private set; }
    public DateTimeOffset? EndDate { get; private set; }
    public int? UsageLimit { get; private set; }
    public int UsedCount { get; private set; }
    public DiscountScope Scope { get; private set; }
    public IReadOnlyCollection<Guid> ApplicableServiceIds => _applicableServiceIds.AsReadOnly();
    public IReadOnlyCollection<Guid> ApplicableCategoryIds => _applicableCategoryIds.AsReadOnly();
    public bool IsActive { get; private set; }

    public Result UpdateDetails(
        string title,
        string? description,
        DiscountType discountType,
        decimal discountValue,
        DateTimeOffset startDate,
        DateTimeOffset? endDate,
        decimal? maxDiscountAmount,
        decimal? minOrderAmount,
        int? usageLimit,
        DiscountScope scope,
        IEnumerable<Guid>? applicableServiceIds,
        IEnumerable<Guid>? applicableCategoryIds)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return Result.Failure("promo.invalid_title", "Tiêu đề chương trình không được để trống.");
        }

        if (discountValue <= 0)
        {
            return Result.Failure("promo.invalid_discount_value", "Giá trị giảm giá phải lớn hơn 0.");
        }

        if (discountType == DiscountType.Percentage && discountValue > 100)
        {
            return Result.Failure("promo.invalid_percentage", "Giảm giá theo phần trăm không được vượt quá 100%.");
        }

        if (maxDiscountAmount is < 0)
        {
            return Result.Failure("promo.invalid_max_discount", "Mức giảm tối đa không được âm.");
        }

        if (minOrderAmount is < 0)
        {
            return Result.Failure("promo.invalid_min_order", "Giá trị đơn hàng tối thiểu không được âm.");
        }

        if (usageLimit.HasValue && usageLimit.Value < UsedCount)
        {
            return Result.Failure("promo.invalid_usage_limit", "Giới hạn lượt dùng mới không được nhỏ hơn số lượt đã dùng thực tế.");
        }

        if (endDate.HasValue && endDate.Value < startDate)
        {
            return Result.Failure("promo.invalid_dates", "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        }

        Title = title.Trim();
        Description = description?.Trim();
        DiscountType = discountType;
        DiscountValue = discountValue;
        StartDate = startDate;
        EndDate = endDate;
        MaxDiscountAmount = maxDiscountAmount;
        MinOrderAmount = minOrderAmount;
        UsageLimit = usageLimit;
        Scope = scope;

        _applicableServiceIds.Clear();
        if (applicableServiceIds != null)
        {
            _applicableServiceIds.AddRange(applicableServiceIds.Distinct());
        }

        _applicableCategoryIds.Clear();
        if (applicableCategoryIds != null)
        {
            _applicableCategoryIds.AddRange(applicableCategoryIds.Distinct());
        }

        Touch();
        return Result.Success();
    }

    public Result CanApply(
        decimal orderAmount,
        IReadOnlyCollection<Guid>? serviceIds,
        IReadOnlyCollection<Guid>? categoryIds,
        DateTimeOffset now)
    {
        if (!IsActive)
        {
            return Result.Failure("promo.inactive", "Mã khuyến mãi hiện đang bị tạm ngưng áp dụng.");
        }

        if (now < StartDate)
        {
            return Result.Failure("promo.not_started", "Chương trình khuyến mãi chưa bắt đầu.");
        }

        if (EndDate.HasValue && now > EndDate.Value)
        {
            return Result.Failure("promo.expired", "Mã khuyến mãi đã hết hạn sử dụng.");
        }

        if (UsageLimit.HasValue && UsedCount >= UsageLimit.Value)
        {
            return Result.Failure("promo.usage_exceeded", "Mã khuyến mãi đã hết lượt sử dụng.");
        }

        if (MinOrderAmount.HasValue && orderAmount < MinOrderAmount.Value)
        {
            return Result.Failure(
                "promo.min_order_not_reached",
                $"Đơn hàng chưa đạt giá trị tối thiểu {MinOrderAmount.Value:N0} đ để áp dụng mã.");
        }

        if (Scope == DiscountScope.SpecificServices)
        {
            if (serviceIds == null || !serviceIds.Any(s => _applicableServiceIds.Contains(s)))
            {
                return Result.Failure(
                    "promo.services_not_applicable",
                    "Mã khuyến mãi không áp dụng cho các dịch vụ trong đơn hàng này.");
            }
        }
        else if (Scope == DiscountScope.SpecificCategories)
        {
            if (categoryIds == null || !categoryIds.Any(c => _applicableCategoryIds.Contains(c)))
            {
                return Result.Failure(
                    "promo.categories_not_applicable",
                    "Mã khuyến mãi không áp dụng cho các nhóm dịch vụ trong đơn hàng này.");
            }
        }

        return Result.Success();
    }

    public decimal CalculateDiscount(decimal eligibleAmount)
    {
        if (eligibleAmount <= 0)
        {
            return 0m;
        }

        decimal discount;
        if (DiscountType == DiscountType.Percentage)
        {
            discount = eligibleAmount * (DiscountValue / 100m);
            if (MaxDiscountAmount.HasValue && discount > MaxDiscountAmount.Value)
            {
                discount = MaxDiscountAmount.Value;
            }
        }
        else
        {
            discount = Math.Min(DiscountValue, eligibleAmount);
        }

        return Math.Round(discount, 0, MidpointRounding.AwayFromZero);
    }

    public Result RecordUsage()
    {
        if (UsageLimit.HasValue && UsedCount >= UsageLimit.Value)
        {
            return Result.Failure("promo.usage_exceeded", "Mã khuyến mãi đã hết lượt sử dụng.");
        }

        UsedCount++;
        Touch();
        return Result.Success();
    }

    public Result Activate()
    {
        if (IsActive)
        {
            return Result.Failure("promo.already_active", "Mã khuyến mãi đang trong trạng thái hoạt động.");
        }

        IsActive = true;
        Touch();
        return Result.Success();
    }

    public Result Deactivate()
    {
        if (!IsActive)
        {
            return Result.Failure("promo.already_inactive", "Mã khuyến mãi đã ở trạng thái tạm ngưng.");
        }

        IsActive = false;
        Touch();
        return Result.Success();
    }

    public static DiscountPromo Rehydrate(
        Guid id,
        string code,
        string title,
        string? description,
        DiscountType discountType,
        decimal discountValue,
        decimal? maxDiscountAmount,
        decimal? minOrderAmount,
        DateTimeOffset startDate,
        DateTimeOffset? endDate,
        int? usageLimit,
        int usedCount,
        DiscountScope scope,
        IEnumerable<Guid>? applicableServiceIds,
        IEnumerable<Guid>? applicableCategoryIds,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var promo = new DiscountPromo(
            id,
            code,
            title,
            discountType,
            discountValue,
            startDate,
            endDate,
            maxDiscountAmount,
            minOrderAmount,
            usageLimit,
            scope,
            applicableServiceIds,
            applicableCategoryIds,
            description,
            isActive);

        promo.UsedCount = usedCount;
        promo.SetAuditDates(createdAt, updatedAt);
        return promo;
    }
}
