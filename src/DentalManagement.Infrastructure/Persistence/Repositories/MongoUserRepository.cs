using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Identity;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoUserRepository : IUserRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoUserRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _context.Users
            .Find(d => d.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : UserDocumentMapper.ToDomain(document);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var document = await _context.Users
            .Find(d => d.Email == normalizedEmail)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : UserDocumentMapper.ToDomain(document);
    }

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return _context.Users
            .Find(d => d.Email == normalizedEmail)
            .AnyAsync(cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        var document = UserDocumentMapper.ToDocument(user);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Users.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Users.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        var document = UserDocumentMapper.ToDocument(user);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Users.ReplaceOneAsync(session, d => d.Id == user.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Users.ReplaceOneAsync(d => d.Id == user.Id, document, cancellationToken: cancellationToken);
    }
}
