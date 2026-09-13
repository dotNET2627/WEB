namespace DentalManagement.Application.Common;

public sealed record PagedQuery(int Page = 1, int PageSize = 20)
{
    public int NormalizedPage => Math.Max(1, Page);
    public int NormalizedPageSize => Math.Clamp(PageSize, 1, 100);
}

public sealed record PagedResult<T>(IReadOnlyCollection<T> Items, int Page, int PageSize, long TotalCount);
