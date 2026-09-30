using DentalManagement.Application.Catalog.Commands.CreateDentalService;
using DentalManagement.Application.Catalog.Commands.CreateServiceCategory;
using DentalManagement.Application.Catalog.Commands.DeleteDentalService;
using DentalManagement.Application.Catalog.Commands.ToggleDentalServiceStatus;
using DentalManagement.Application.Catalog.Commands.UpdateDentalService;
using DentalManagement.Application.Catalog.Common;
using DentalManagement.Application.Catalog.Queries.GetActiveDentalServices;
using DentalManagement.Application.Catalog.Queries.GetDentalServiceById;
using DentalManagement.Application.Catalog.Queries.GetDentalServicesPaged;
using DentalManagement.Application.Catalog.Queries.GetServiceCategories;
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

        // Patient Handlers
        services.AddScoped<ICommandHandler<CreatePatientCommand, Result<Guid>>, CreatePatientHandler>();

        // Catalog / Services Handlers
        services.AddScoped<ICommandHandler<CreateDentalServiceCommand, Result<Guid>>, CreateDentalServiceCommandHandler>();
        services.AddScoped<ICommandHandler<UpdateDentalServiceCommand, Result>, UpdateDentalServiceCommandHandler>();
        services.AddScoped<ICommandHandler<ToggleDentalServiceStatusCommand, Result>, ToggleDentalServiceStatusCommandHandler>();
        services.AddScoped<ICommandHandler<DeleteDentalServiceCommand, Result>, DeleteDentalServiceCommandHandler>();
        services.AddScoped<ICommandHandler<CreateServiceCategoryCommand, Result<Guid>>, CreateServiceCategoryCommandHandler>();

        services.AddScoped<IQueryHandler<GetDentalServicesPagedQuery, Result<PagedResult<DentalServiceDto>>>, GetDentalServicesPagedQueryHandler>();
        services.AddScoped<IQueryHandler<GetDentalServiceByIdQuery, Result<DentalServiceDto>>, GetDentalServiceByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetActiveDentalServicesQuery, Result<IReadOnlyList<DentalServiceDto>>>, GetActiveDentalServicesQueryHandler>();
        services.AddScoped<IQueryHandler<GetServiceCategoriesQuery, Result<IReadOnlyList<ServiceCategoryDto>>>, GetServiceCategoriesQueryHandler>();

        return services;
    }
}
