namespace DentalManagement.Domain.Common;

public sealed record Error(string Code, string Message);

public class Result
{
    protected Result(bool isSuccess, Error? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Error? Error { get; }

    public static Result Success() => new(true, null);
    public static Result Failure(string code, string message) => new(false, new Error(code, message));
}

public sealed class Result<T> : Result
{
    private Result(T? value, bool isSuccess, Error? error)
        : base(isSuccess, error)
    {
        Value = value;
    }

    public T? Value { get; }

    public static Result<T> Success(T value) => new(value, true, null);
    public static new Result<T> Failure(string code, string message) => new(default, false, new Error(code, message));
}
