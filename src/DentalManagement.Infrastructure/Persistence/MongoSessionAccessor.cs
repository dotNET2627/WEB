using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence;

public sealed class MongoSessionAccessor
{
    private readonly AsyncLocal<IClientSessionHandle?> _current = new();

    public IClientSessionHandle? Current
    {
        get => _current.Value;
        set => _current.Value = value;
    }
}
