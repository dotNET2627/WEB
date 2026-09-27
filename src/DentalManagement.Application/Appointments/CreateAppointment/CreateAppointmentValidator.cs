using FluentValidation;

namespace DentalManagement.Application.Appointments.CreateAppointment;

public sealed class CreateAppointmentValidator
    : AbstractValidator<CreateAppointmentCommand>
{
    public CreateAppointmentValidator()
    {
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.ClinicId).NotEmpty();

        RuleFor(x => x.StartsAt)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Thời gian bắt đầu phải ở tương lai.");

        RuleFor(x => x.EndsAt)
            .GreaterThan(x => x.StartsAt)
            .WithMessage("Thời gian kết thúc phải sau thời gian bắt đầu.")
            .When(x => x.EndsAt.HasValue);

        RuleFor(x => x.PlannedServices)
            .NotEmpty()
            .WithMessage("Phải có ít nhất một dịch vụ dự kiến.");

        RuleForEach(x => x.PlannedServices).ChildRules(s =>
        {
            s.RuleFor(p => p.ServiceId).NotEmpty();
            s.RuleFor(p => p.ServiceName).NotEmpty().MaximumLength(200);
            s.RuleFor(p => p.UnitPrice).GreaterThan(0);
        });
    }
}
