using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Patients;

namespace DentalManagement.Application.Tests.Fakes;

/// <summary>In-memory <see cref="IPatientRepository"/> for unit tests.</summary>
internal sealed class FakePatientRepository : IPatientRepository
{
    public List<Patient> Patients { get; } = [];

    public bool FailUpdateMedicalHistory { get; set; }
    public bool FailUpdateOdontogram { get; set; }

    public Task<Patient?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(Patients.FirstOrDefault(patient => patient.Id == id));

    public Task<Patient?> GetByIdAsync(Guid clinicId, Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(Patients.FirstOrDefault(patient => patient.Id == id && patient.ClinicId == clinicId));

    public Task<IReadOnlyList<Patient>> GetByIdsAsync(Guid clinicId, IEnumerable<Guid> ids, CancellationToken cancellationToken)
    {
        var patientIds = ids.ToHashSet();
        return Task.FromResult<IReadOnlyList<Patient>>(Patients.Where(patient =>
            patient.ClinicId == clinicId && patientIds.Contains(patient.Id)).ToList());
    }

    public Task<bool> PatientCodeExistsAsync(Guid clinicId, string patientCode, CancellationToken cancellationToken) =>
        Task.FromResult(Patients.Any(patient =>
            patient.ClinicId == clinicId && patient.PatientCode == patientCode.Trim()));

    public Task AddAsync(Patient patient, CancellationToken cancellationToken)
    {
        Patients.Add(patient);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(Patient patient, CancellationToken cancellationToken)
    {
        var index = Patients.FindIndex(existing => existing.Id == patient.Id);
        if (index >= 0)
        {
            Patients[index] = patient;
        }

        return Task.CompletedTask;
    }

    public Task<PagedResult<Patient>> GetPageAsync(
        Guid clinicId, PagedQuery paging, string? search, CancellationToken cancellationToken)
    {
        var items = Patients.Where(patient => patient.ClinicId == clinicId).ToArray();
        return Task.FromResult(new PagedResult<Patient>(
            items, paging.NormalizedPage, paging.NormalizedPageSize, items.Length));
    }

    public Task<bool> UpdateProfileAsync(Patient patient, CancellationToken cancellationToken) =>
        Task.FromResult(Find(patient.ClinicId, patient.Id) is not null);

    public Task<bool> UpdateMedicalHistoryAsync(Patient patient, CancellationToken cancellationToken) =>
        Task.FromResult(!FailUpdateMedicalHistory && Find(patient.ClinicId, patient.Id) is not null);

    public Task<bool> UpdateOdontogramAsync(Patient patient, CancellationToken cancellationToken) =>
        Task.FromResult(!FailUpdateOdontogram && Find(patient.ClinicId, patient.Id) is not null);

    public Task<bool> SoftDeleteAsync(Guid clinicId, Guid id, CancellationToken cancellationToken)
    {
        var patient = Find(clinicId, id);
        return Task.FromResult(patient is not null && Patients.Remove(patient));
    }

    private Patient? Find(Guid clinicId, Guid id) =>
        Patients.FirstOrDefault(patient => patient.Id == id && patient.ClinicId == clinicId);
}
