using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.Identity;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoRoleRepository : IRoleRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoRoleRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Role?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _context.Roles
            .Find(d => d.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : RoleDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<Role>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.Distinct().ToList();
        if (idList.Count == 0)
        {
            return [];
        }

        var documents = await _context.Roles
            .Find(d => idList.Contains(d.Id))
            .ToListAsync(cancellationToken);

        return documents.Select(RoleDocumentMapper.ToDomain).ToList();
    }

    public async Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        var trimmed = name.Trim();
        var document = await _context.Roles
            .Find(d => d.Name == trimmed)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : RoleDocumentMapper.ToDomain(document);
    }

    public async Task<IReadOnlyList<Role>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var documents = await _context.Roles
            .Find(_ => true)
            .ToListAsync(cancellationToken);

        return documents.Select(RoleDocumentMapper.ToDomain).ToList();
    }

    public async Task AddAsync(Role role, CancellationToken cancellationToken = default)
    {
        var document = RoleDocumentMapper.ToDocument(role);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Roles.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Roles.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task UpdateAsync(Role role, CancellationToken cancellationToken = default)
    {
        var document = RoleDocumentMapper.ToDocument(role);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Roles.ReplaceOneAsync(session, d => d.Id == role.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Roles.ReplaceOneAsync(d => d.Id == role.Id, document, cancellationToken: cancellationToken);
    }
}
