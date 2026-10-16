using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Patients.Odontogram;

public sealed record GetOdontogramQuery(Guid ClinicId, Guid PatientId);

public sealed class GetOdontogramHandler(
    IPatientRepository patients)
    : IQueryHandler<GetOdontogramQuery, Result<IReadOnlyList<ToothConditionDto>>>
{
    public async Task<Result<IReadOnlyList<ToothConditionDto>>> Handle(
        GetOdontogramQuery query,
        CancellationToken cancellationToken)
    {
        var patient = await patients.GetByIdAsync(query.ClinicId, query.PatientId, cancellationToken);
        if (patient is null)
        {
            return Result<IReadOnlyList<ToothConditionDto>>.Failure(
                "patient.not_found", "Không tìm thấy bệnh nhân.");
        }

        var teeth = patient.Teeth
            .Select(ToothConditionDto.FromDomain)
            .OrderBy(tooth => tooth.ToothNumber)
            .ToArray();

        return Result<IReadOnlyList<ToothConditionDto>>.Success(teeth);
    }
}
