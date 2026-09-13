using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Patients;

namespace DentalManagement.Application.Patients.CreatePatient;

public sealed class CreatePatientHandler : ICommandHandler<CreatePatientCommand, Result<Guid>>
{
    private readonly IPatientRepository _patients;

    public CreatePatientHandler(IPatientRepository patients)
    {
        _patients = patients;
    }

    public async Task<Result<Guid>> Handle(CreatePatientCommand command, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(command.PatientCode) &&
            await _patients.PatientCodeExistsAsync(command.ClinicId, command.PatientCode, cancellationToken))
        {
            return Result<Guid>.Failure("patient.duplicate_code", "Patient code already exists in this clinic.");
        }

        var patient = new Patient(Guid.NewGuid(), command.ClinicId, command.FullName, command.PatientCode);
        patient.UpdateContact(command.FullName, command.PhoneNumber, command.DateOfBirth);

        await _patients.AddAsync(patient, cancellationToken);
        return Result<Guid>.Success(patient.Id);
    }
}
