using DentalManagement.Application.Common;
using DentalManagement.Application.Identity.Commands.Login;
using DentalManagement.Application.Identity.Commands.RefreshToken;
using DentalManagement.Application.Identity.Commands.RevokeToken;
using DentalManagement.Application.Identity.Commands.SwitchClinic;
using DentalManagement.Application.Identity.Queries.GetCurrentUser;
using DentalManagement.Application.Patients.CreatePatient;
using DentalManagement.Domain.Common;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace DentalManagement.Application.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // FluentValidation
        services.AddValidatorsFromAssemblyContaining<LoginCommandValidator>();

        // Identity Handlers
        services.AddScoped<ICommandHandler<LoginCommand, Result<LoginResponseDto>>, LoginCommandHandler>();
        services.AddScoped<ICommandHandler<RefreshTokenCommand, Result<RefreshTokenResponseDto>>, RefreshTokenCommandHandler>();
        services.AddScoped<ICommandHandler<RevokeTokenCommand, Result>, RevokeTokenCommandHandler>();
        services.AddScoped<ICommandHandler<SwitchClinicCommand, Result<SwitchClinicResponseDto>>, SwitchClinicCommandHandler>();
        services.AddScoped<IQueryHandler<GetCurrentUserQuery, Result<CurrentUserDto>>, GetCurrentUserQueryHandler>();

        // Feature Handlers
        services.AddScoped<ICommandHandler<CreatePatientCommand, Result<Guid>>, CreatePatientHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.CreateAppointment.CreateAppointmentCommand, Result<Guid>>, DentalManagement.Application.Appointments.CreateAppointment.CreateAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.UpdateAppointment.UpdateAppointmentCommand, Result>, DentalManagement.Application.Appointments.UpdateAppointment.UpdateAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.ConfirmAppointment.ConfirmAppointmentCommand, Result>, DentalManagement.Application.Appointments.ConfirmAppointment.ConfirmAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.CancelAppointment.CancelAppointmentCommand, Result>, DentalManagement.Application.Appointments.CancelAppointment.CancelAppointmentHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Appointments.GetAppointment.GetAppointmentQuery, Result<DentalManagement.Application.Appointments.GetAppointment.AppointmentDto>>, DentalManagement.Application.Appointments.GetAppointment.GetAppointmentHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Appointments.ListAppointments.ListAppointmentsQuery, Result<IReadOnlyList<DentalManagement.Application.Appointments.ListAppointments.AppointmentSummaryDto>>>, DentalManagement.Application.Appointments.ListAppointments.ListAppointmentsHandler>();

        return services;
    }
}
