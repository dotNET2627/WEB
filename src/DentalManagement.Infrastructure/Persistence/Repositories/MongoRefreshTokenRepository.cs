using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Identity;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoRefreshTokenRepository : IRefreshTokenRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoRefreshTokenRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var document = await _context.RefreshTokens
            .Find(d => d.TokenHash == tokenHash)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : RefreshTokenDocumentMapper.ToDomain(document);
    }

    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        var document = RefreshTokenDocumentMapper.ToDocument(refreshToken);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.RefreshTokens.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.RefreshTokens.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task UpdateAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        var document = RefreshTokenDocumentMapper.ToDocument(refreshToken);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.RefreshTokens.ReplaceOneAsync(session, d => d.Id == refreshToken.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.RefreshTokens.ReplaceOneAsync(d => d.Id == refreshToken.Id, document, cancellationToken: cancellationToken);
    }

    public async Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var filter = Builders<RefreshTokenDocument>.Filter.And(
            Builders<RefreshTokenDocument>.Filter.Eq(d => d.UserId, userId),
            Builders<RefreshTokenDocument>.Filter.Eq(d => d.RevokedAt, null));

        var update = Builders<RefreshTokenDocument>.Update
            .Set(d => d.RevokedAt, now)
            .Set(d => d.ReplacedByTokenHash, "REVOKED_FAMILY");

        if (_sessionAccessor.Current is { } session)
        {
            await _context.RefreshTokens.UpdateManyAsync(session, filter, update, cancellationToken: cancellationToken);
            return;
        }

        await _context.RefreshTokens.UpdateManyAsync(filter, update, cancellationToken: cancellationToken);
    }
}
