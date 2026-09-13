namespace DentalManagement.Api.Contracts;

public sealed record ApiResponse<T>(T Data, string? Message = null);

public sealed record PagedResponse<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    long TotalCount);
