using System.Text.RegularExpressions;
using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Promotions;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoDiscountPromoRepository : IDiscountPromoRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoDiscountPromoRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<DiscountPromo?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.DiscountPromos
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : DiscountPromoDocumentMapper.ToDomain(document);
    }

    public async Task<DiscountPromo?> GetByCodeAsync(string code, CancellationToken cancellationToken)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var document = await _context.DiscountPromos
            .Find(x => x.Code == normalized)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : DiscountPromoDocumentMapper.ToDomain(document);
    }

    public Task<bool> PromoCodeExistsAsync(string code, Guid? excludingId, CancellationToken cancellationToken)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var filterBuilder = Builders<DiscountPromoDocument>.Filter;
        var filter = filterBuilder.Eq(x => x.Code, normalized);

        if (excludingId.HasValue)
        {
            filter &= filterBuilder.Ne(x => x.Id, excludingId.Value);
        }

        return _context.DiscountPromos.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<PagedResult<DiscountPromo>> SearchAsync(
        string? searchTerm,
        DiscountType? discountType,
        bool? isActive,
        PagedQuery pagedQuery,
        CancellationToken cancellationToken)
    {
        var filterBuilder = Builders<DiscountPromoDocument>.Filter;
        var filter = filterBuilder.Empty;

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var pattern = Regex.Escape(searchTerm.Trim());
            var regex = new BsonRegularExpression(pattern, "i");
            filter &= filterBuilder.Or(
                filterBuilder.Regex(x => x.Code, regex),
                filterBuilder.Regex(x => x.Title, regex));
        }

        if (discountType.HasValue)
        {
            filter &= filterBuilder.Eq(x => x.DiscountType, (int)discountType.Value);
        }

        if (isActive.HasValue)
        {
            filter &= filterBuilder.Eq(x => x.IsActive, isActive.Value);
        }

        var totalCount = await _context.DiscountPromos.CountDocumentsAsync(filter, cancellationToken: cancellationToken);

        var skip = (pagedQuery.Page - 1) * pagedQuery.PageSize;
        var documents = await _context.DiscountPromos
            .Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Limit(pagedQuery.PageSize)
            .ToListAsync(cancellationToken);

        var items = documents.Select(DiscountPromoDocumentMapper.ToDomain).ToList();

        return new PagedResult<DiscountPromo>(items, pagedQuery.Page, pagedQuery.PageSize, totalCount);
    }

    public async Task AddAsync(DiscountPromo promo, CancellationToken cancellationToken)
    {
        var document = DiscountPromoDocumentMapper.ToDocument(promo);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.DiscountPromos.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.DiscountPromos.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(DiscountPromo promo, CancellationToken cancellationToken)
    {
        var document = DiscountPromoDocumentMapper.ToDocument(promo);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.DiscountPromos.ReplaceOneAsync(
                session,
                x => x.Id == document.Id,
                document,
                cancellationToken: cancellationToken);
            return;
        }

        await _context.DiscountPromos.ReplaceOneAsync(
            x => x.Id == document.Id,
            document,
            cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (_sessionAccessor.Current is { } session)
        {
            await _context.DiscountPromos.DeleteOneAsync(
                session,
                x => x.Id == id,
                cancellationToken: cancellationToken);
            return;
        }

        await _context.DiscountPromos.DeleteOneAsync(x => x.Id == id, cancellationToken: cancellationToken);
    }
}
