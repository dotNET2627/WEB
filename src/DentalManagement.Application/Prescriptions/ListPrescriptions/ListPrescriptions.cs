using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Prescriptions;

namespace DentalManagement.Application.Prescriptions.ListPrescriptions;

public sealed record ListPrescriptionsQuery(
    Guid ClinicId,
    Guid? PatientId = null,
    PrescriptionStatus? Status = null);

public sealed record PrescriptionItemDto(
    Guid? InventoryItemId,
    string MedicationName,
    string Dosage,
    int Quantity,
    string Unit,
    string Instructions);

public sealed record PrescriptionDto(
    Guid Id,
    Guid ClinicId,
    string Code,
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    Guid? DoctorId,
    string DoctorName,
    string Diagnosis,
    string? MedicalNotes,
    string Status,
    IReadOnlyList<PrescriptionItemDto> Items,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DispensedAt);

public sealed class ListPrescriptionsHandler
    : IQueryHandler<ListPrescriptionsQuery, Result<IReadOnlyList<PrescriptionDto>>>
{
    private readonly IPrescriptionRepository _prescriptionRepository;

    public ListPrescriptionsHandler(IPrescriptionRepository prescriptionRepository)
    {
        _prescriptionRepository = prescriptionRepository;
    }

    public async Task<Result<IReadOnlyList<PrescriptionDto>>> Handle(
        ListPrescriptionsQuery query,
        CancellationToken cancellationToken)
    {
        var prescriptions = await _prescriptionRepository.ListByClinicAsync(
            query.ClinicId,
            query.PatientId,
            query.Status,
            cancellationToken);

        var result = prescriptions
            .Select(p => new PrescriptionDto(
                p.Id,
                p.ClinicId,
                p.Code,
                p.PatientId,
                p.PatientName,
                p.PatientCode,
                p.DoctorId,
                p.DoctorName,
                p.Diagnosis,
                p.MedicalNotes,
                p.Status.ToString(),
                p.Items.Select(i => new PrescriptionItemDto(
                    i.InventoryItemId,
                    i.MedicationName,
                    i.Dosage,
                    i.Quantity,
                    i.Unit,
                    i.Instructions)).ToList(),
                p.CreatedAt,
                p.DispensedAt))
            .ToList();

        return Result<IReadOnlyList<PrescriptionDto>>.Success(result);
    }
}
