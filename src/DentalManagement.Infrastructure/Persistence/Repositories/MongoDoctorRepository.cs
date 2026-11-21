using System.Text.RegularExpressions;
using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Doctors;
using DentalManagement.Infrastructure.Persistence.Documents;
using DentalManagement.Infrastructure.Persistence.Mappings;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DentalManagement.Infrastructure.Persistence.Repositories;

public sealed class MongoDoctorRepository : IDoctorRepository
{
    private readonly MongoDatabaseContext _context;
    private readonly MongoSessionAccessor _sessionAccessor;

    public MongoDoctorRepository(MongoDatabaseContext context, MongoSessionAccessor sessionAccessor)
    {
        _context = context;
        _sessionAccessor = sessionAccessor;
    }

    public async Task<Doctor?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.Doctors
            .Find(d => d.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : DoctorDocumentMapper.ToDomain(document);
    }

    public async Task<Doctor?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var document = await _context.Doctors
            .Find(d => d.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : DoctorDocumentMapper.ToDomain(document);
    }

    public async Task<Doctor?> GetByLicenseNumberAsync(string licenseNumber, CancellationToken cancellationToken)
    {
        var pattern = new BsonRegularExpression($"^{Regex.Escape(licenseNumber.Trim())}$", "i");
        var filter = Builders<DoctorDocument>.Filter.Regex(d => d.MedicalLicenseNumber, pattern);

        var document = await _context.Doctors
            .Find(filter)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : DoctorDocumentMapper.ToDomain(document);
    }

    public async Task<bool> LicenseNumberExistsAsync(string licenseNumber, Guid? excludeId, CancellationToken cancellationToken)
    {
        var builder = Builders<DoctorDocument>.Filter;
        var pattern = new BsonRegularExpression($"^{Regex.Escape(licenseNumber.Trim())}$", "i");
        var filter = builder.Regex(d => d.MedicalLicenseNumber, pattern);

        if (excludeId.HasValue)
        {
            filter &= builder.Ne(d => d.Id, excludeId.Value);
        }

        return await _context.Doctors.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<bool> UserIdExistsAsync(Guid userId, Guid? excludeId, CancellationToken cancellationToken)
    {
        var builder = Builders<DoctorDocument>.Filter;
        var filter = builder.Eq(d => d.UserId, userId);

        if (excludeId.HasValue)
        {
            filter &= builder.Ne(d => d.Id, excludeId.Value);
        }

        return await _context.Doctors.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<PagedResult<Doctor>> GetPagedAsync(
        int page,
        int pageSize,
        Guid? clinicId,
        string? specialty,
        string? searchTerm,
        CancellationToken cancellationToken)
    {
        var builder = Builders<DoctorDocument>.Filter;
        var filter = builder.Empty;

        if (clinicId.HasValue)
        {
            filter &= builder.Eq(d => d.ClinicId, clinicId.Value);
        }

        if (!string.IsNullOrWhiteSpace(specialty))
        {
            var specPattern = new BsonRegularExpression(Regex.Escape(specialty.Trim()), "i");
            filter &= builder.Regex(d => d.Specialty, specPattern);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var searchPattern = new BsonRegularExpression(Regex.Escape(searchTerm.Trim()), "i");
            var orFilter = builder.Or(
                builder.Regex(d => d.MedicalLicenseNumber, searchPattern),
                builder.Regex(d => d.Specialty, searchPattern),
                builder.Regex(d => d.Biography, searchPattern));
            filter &= orFilter;
        }

        var totalCount = await _context.Doctors.CountDocumentsAsync(filter, cancellationToken: cancellationToken);

        var documents = await _context.Doctors
            .Find(filter)
            .SortByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        var items = documents.Select(DoctorDocumentMapper.ToDomain).ToList();
        return new PagedResult<Doctor>(items, page, pageSize, totalCount);
    }

    public async Task AddAsync(Doctor doctor, CancellationToken cancellationToken)
    {
        var document = DoctorDocumentMapper.ToDocument(doctor);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Doctors.InsertOneAsync(session, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Doctors.InsertOneAsync(document, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAsync(Doctor doctor, CancellationToken cancellationToken)
    {
        var document = DoctorDocumentMapper.ToDocument(doctor);

        if (_sessionAccessor.Current is { } session)
        {
            await _context.Doctors.ReplaceOneAsync(session, d => d.Id == doctor.Id, document, cancellationToken: cancellationToken);
            return;
        }

        await _context.Doctors.ReplaceOneAsync(d => d.Id == doctor.Id, document, cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (_sessionAccessor.Current is { } session)
        {
            await _context.Doctors.DeleteOneAsync(session, d => d.Id == id, cancellationToken: cancellationToken);
            return;
        }

        await _context.Doctors.DeleteOneAsync(d => d.Id == id, cancellationToken: cancellationToken);
    }
}
