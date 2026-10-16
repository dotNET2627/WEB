using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Domain.MedicalImages;

namespace DentalManagement.Application.Tests.Fakes;

/// <summary>In-memory <see cref="IMedicalImageRepository"/> for unit tests.</summary>
internal sealed class FakeMedicalImageRepository : IMedicalImageRepository
{
    public List<MedicalImage> Images { get; } = [];
    public bool FailAdd { get; set; }

    public Task<MedicalImage?> GetByIdAsync(Guid clinicId, Guid patientId, Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(Images.FirstOrDefault(image =>
            image.Id == id && image.ClinicId == clinicId && image.PatientId == patientId));

    public Task<IReadOnlyList<MedicalImage>> ListByPatientAsync(Guid clinicId, Guid patientId, CancellationToken cancellationToken)
    {
        IReadOnlyList<MedicalImage> result = Images
            .Where(image => image.ClinicId == clinicId && image.PatientId == patientId)
            .OrderByDescending(image => image.CreatedAt)
            .ToArray();
        return Task.FromResult(result);
    }

    public Task AddAsync(MedicalImage image, CancellationToken cancellationToken)
    {
        if (FailAdd)
        {
            throw new InvalidOperationException("Database is unavailable.");
        }

        Images.Add(image);
        return Task.CompletedTask;
    }

    public Task<bool> DeleteAsync(Guid clinicId, Guid patientId, Guid id, CancellationToken cancellationToken)
    {
        var image = Images.FirstOrDefault(existing =>
            existing.Id == id && existing.ClinicId == clinicId && existing.PatientId == patientId);
        return Task.FromResult(image is not null && Images.Remove(image));
    }
}
