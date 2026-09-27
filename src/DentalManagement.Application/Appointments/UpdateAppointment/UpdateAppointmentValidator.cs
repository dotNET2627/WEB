using FluentValidation;

namespace DentalManagement.Application.Appointments.UpdateAppointment;

public sealed class UpdateAppointmentValidator
    : AbstractValidator<UpdateAppointmentCommand>
{
    public UpdateAppointmentValidator()
    {
        RuleFor(x => x.AppointmentId).NotEmpty();

        RuleFor(x => x.StartsAt)
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Thời gian bắt đầu phải ở tương lai.");

        RuleFor(x => x.EndsAt)
            .GreaterThan(x => x.StartsAt)
            .WithMessage("Thời gian kết thúc phải sau thời gian bắt đầu.")
            .When(x => x.EndsAt.HasValue);
    }
}
