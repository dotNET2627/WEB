using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Insurance;

namespace DentalManagement.Application.Insurance.CreateClaim;

public sealed class CreateInsuranceClaimHandler
    : ICommandHandler<CreateInsuranceClaimCommand, Result<Guid>>
{
    private readonly IInsuranceClaimRepository _claims;
    private readonly IPatientRepository _patients;
    private readonly IInvoiceRepository _invoices;
    private readonly IAppointmentRepository _appointments;
    private readonly ITransactionRunner _tx;

    public CreateInsuranceClaimHandler(
        IInsuranceClaimRepository claims,
        IPatientRepository patients,
        IInvoiceRepository invoices,
        IAppointmentRepository appointments,
        ITransactionRunner tx)
    {
        _claims = claims;
        _patients = patients;
        _invoices = invoices;
        _appointments = appointments;
        _tx = tx;
    }

    public async Task<Result<Guid>> Handle(CreateInsuranceClaimCommand command, CancellationToken cancellationToken)
    {
        var patient = await _patients.GetByIdAsync(command.ClinicId, command.PatientId, cancellationToken);
        if (patient is null)
            return Result<Guid>.Failure("patient.not_found", $"Không tìm thấy bệnh nhân '{command.PatientId}'.");

        if (command.InvoiceId is { } invoiceId)
        {
            var invoice = await _invoices.GetByIdAsync(invoiceId, cancellationToken);
            if (invoice is null || invoice.ClinicId != command.ClinicId || invoice.PatientId != command.PatientId)
                return Result<Guid>.Failure("invoice.not_found", "Không tìm thấy hóa đơn của bệnh nhân trong phòng khám.");
        }

        if (command.AppointmentId is { } appointmentId)
        {
            var appointment = await _appointments.GetByIdAsync(appointmentId, cancellationToken);
            if (appointment is null || appointment.ClinicId != command.ClinicId || appointment.PatientId != command.PatientId)
                return Result<Guid>.Failure("appointment.not_found", "Không tìm thấy lịch hẹn của bệnh nhân trong phòng khám.");
        }

        var claimNumber = await _claims.GenerateNextClaimNumberAsync(command.ClinicId, cancellationToken);

        decimal initialAmount = command.Items.Sum(i => i.Quantity * i.UnitPrice);

        var claim = new InsuranceClaim(
            Guid.NewGuid(),
            command.PatientId,
            command.ClinicId,
            claimNumber,
            command.InsuranceType,
            command.ProviderName,
            command.CardNumber,
            initialAmount,
            command.PolicyNumber,
            command.CoverageRate,
            command.InvoiceId,
            command.AppointmentId,
            command.Diagnosis,
            command.DoctorName,
            command.Notes);

        foreach (var item in command.Items)
        {
            var addResult = claim.AddItem(new InsuranceClaimItem(
                item.Description,
                item.Quantity,
                item.UnitPrice,
                null,
                item.ToothNumber,
                item.ServiceId));

            if (addResult.IsFailure)
                return Result<Guid>.Failure(addResult.Error!.Code, addResult.Error.Message);
        }

        await _tx.RunAsync(async () => await _claims.AddAsync(claim, cancellationToken), cancellationToken);

        return Result<Guid>.Success(claim.Id);
    }
}
