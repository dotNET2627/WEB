using DentalManagement.Application.Common;
using DentalManagement.Application.Identity.Commands.Login;
using DentalManagement.Application.Identity.Commands.RefreshToken;
using DentalManagement.Application.Identity.Commands.RevokeToken;
using DentalManagement.Application.Identity.Commands.SwitchClinic;
using DentalManagement.Application.Identity.Queries.GetCurrentUser;
using DentalManagement.Application.Patients;
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
        services.AddScoped<PatientService>();

        // Clinic Handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Clinics.Commands.CreateClinic.CreateClinicCommand, Result<DentalManagement.Application.Clinics.Dtos.ClinicDto>>, DentalManagement.Application.Clinics.Commands.CreateClinic.CreateClinicCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Clinics.Commands.UpdateClinic.UpdateClinicCommand, Result<DentalManagement.Application.Clinics.Dtos.ClinicDto>>, DentalManagement.Application.Clinics.Commands.UpdateClinic.UpdateClinicCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Clinics.Commands.DeleteClinic.DeleteClinicCommand, Result>, DentalManagement.Application.Clinics.Commands.DeleteClinic.DeleteClinicCommandHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Clinics.Queries.GetClinicById.GetClinicByIdQuery, Result<DentalManagement.Application.Clinics.Dtos.ClinicDto>>, DentalManagement.Application.Clinics.Queries.GetClinicById.GetClinicByIdQueryHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Clinics.Queries.GetClinics.GetClinicsQuery, Result<PagedResult<DentalManagement.Application.Clinics.Dtos.ClinicDto>>>, DentalManagement.Application.Clinics.Queries.GetClinics.GetClinicsQueryHandler>();

        // Doctor Handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.CreateDoctor.CreateDoctorCommand, Result<DentalManagement.Application.Doctors.Dtos.DoctorDto>>, DentalManagement.Application.Doctors.Commands.CreateDoctor.CreateDoctorCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.UpdateDoctor.UpdateDoctorCommand, Result<DentalManagement.Application.Doctors.Dtos.DoctorDto>>, DentalManagement.Application.Doctors.Commands.UpdateDoctor.UpdateDoctorCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.DeleteDoctor.DeleteDoctorCommand, Result>, DentalManagement.Application.Doctors.Commands.DeleteDoctor.DeleteDoctorCommandHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Doctors.Queries.GetDoctorById.GetDoctorByIdQuery, Result<DentalManagement.Application.Doctors.Dtos.DoctorDto>>, DentalManagement.Application.Doctors.Queries.GetDoctorById.GetDoctorByIdQueryHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Doctors.Queries.GetDoctors.GetDoctorsQuery, Result<PagedResult<DentalManagement.Application.Doctors.Dtos.DoctorDto>>>, DentalManagement.Application.Doctors.Queries.GetDoctors.GetDoctorsQueryHandler>();

        // Doctor Work Schedule Handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.AssignWorkSchedule.AssignWorkScheduleCommand, Result<DentalManagement.Application.Doctors.Dtos.WorkScheduleDto>>, DentalManagement.Application.Doctors.Commands.AssignWorkSchedule.AssignWorkScheduleCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules.SetDoctorWorkSchedulesCommand, Result<IReadOnlyList<DentalManagement.Application.Doctors.Dtos.WorkScheduleDto>>>, DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules.SetDoctorWorkSchedulesCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.RemoveWorkSchedule.RemoveWorkScheduleCommand, Result>, DentalManagement.Application.Doctors.Commands.RemoveWorkSchedule.RemoveWorkScheduleCommandHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Doctors.Queries.GetDoctorWorkSchedules.GetDoctorWorkSchedulesQuery, Result<IReadOnlyList<DentalManagement.Application.Doctors.Dtos.WorkScheduleDto>>>, DentalManagement.Application.Doctors.Queries.GetDoctorWorkSchedules.GetDoctorWorkSchedulesQueryHandler>();

        return services;
    }
}
