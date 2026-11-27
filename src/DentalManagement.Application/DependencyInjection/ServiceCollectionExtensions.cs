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
using DentalManagement.Application.Patients;
using DentalManagement.Application.Treatments.ChangeTreatmentStepStatus;
using DentalManagement.Application.Treatments.Common;
using DentalManagement.Application.Treatments.CreateTreatmentStep;
using DentalManagement.Application.Treatments.DeleteTreatmentStep;
using DentalManagement.Application.Treatments.GetTreatmentStepsByPlan;
using DentalManagement.Application.Treatments.UpdateTreatmentStep;
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
        services.AddScoped<MedicalImages.MedicalImageService>();
        services.AddScoped<IQueryHandler<Patients.Odontogram.GetOdontogramQuery, Result<IReadOnlyList<Patients.ToothConditionDto>>>, Patients.Odontogram.GetOdontogramHandler>();
        services.AddScoped<ICommandHandler<Patients.Odontogram.UpdateToothConditionCommand, Result<Patients.ToothConditionDto>>, Patients.Odontogram.UpdateToothConditionCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.CreateAppointment.CreateAppointmentCommand, Result<Guid>>, DentalManagement.Application.Appointments.CreateAppointment.CreateAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.UpdateAppointment.UpdateAppointmentCommand, Result>, DentalManagement.Application.Appointments.UpdateAppointment.UpdateAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.ConfirmAppointment.ConfirmAppointmentCommand, Result>, DentalManagement.Application.Appointments.ConfirmAppointment.ConfirmAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.CancelAppointment.CancelAppointmentCommand, Result>, DentalManagement.Application.Appointments.CancelAppointment.CancelAppointmentHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Appointments.GetAppointment.GetAppointmentQuery, Result<DentalManagement.Application.Appointments.GetAppointment.AppointmentDto>>, DentalManagement.Application.Appointments.GetAppointment.GetAppointmentHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Appointments.ListAppointments.ListAppointmentsQuery, Result<IReadOnlyList<DentalManagement.Application.Appointments.ListAppointments.AppointmentSummaryDto>>>, DentalManagement.Application.Appointments.ListAppointments.ListAppointmentsHandler>();

        // Doctor Handlers
        services.AddScoped<IQueryHandler<DentalManagement.Application.Doctors.Queries.GetDoctors.GetDoctorsQuery, Result<DentalManagement.Application.Common.PagedResult<DentalManagement.Application.Doctors.Dtos.DoctorDto>>>, DentalManagement.Application.Doctors.Queries.GetDoctors.GetDoctorsQueryHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Doctors.Queries.GetDoctorById.GetDoctorByIdQuery, Result<DentalManagement.Application.Doctors.Dtos.DoctorDto>>, DentalManagement.Application.Doctors.Queries.GetDoctorById.GetDoctorByIdQueryHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.CreateDoctor.CreateDoctorCommand, Result<DentalManagement.Application.Doctors.Dtos.DoctorDto>>, DentalManagement.Application.Doctors.Commands.CreateDoctor.CreateDoctorCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.UpdateDoctor.UpdateDoctorCommand, Result<DentalManagement.Application.Doctors.Dtos.DoctorDto>>, DentalManagement.Application.Doctors.Commands.UpdateDoctor.UpdateDoctorCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.DeleteDoctor.DeleteDoctorCommand, Result>, DentalManagement.Application.Doctors.Commands.DeleteDoctor.DeleteDoctorCommandHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Doctors.Queries.GetDoctorWorkSchedules.GetDoctorWorkSchedulesQuery, Result<IReadOnlyList<DentalManagement.Application.Doctors.Dtos.WorkScheduleDto>>>, DentalManagement.Application.Doctors.Queries.GetDoctorWorkSchedules.GetDoctorWorkSchedulesQueryHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.AssignWorkSchedule.AssignWorkScheduleCommand, Result<DentalManagement.Application.Doctors.Dtos.WorkScheduleDto>>, DentalManagement.Application.Doctors.Commands.AssignWorkSchedule.AssignWorkScheduleCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules.SetDoctorWorkSchedulesCommand, Result<IReadOnlyList<DentalManagement.Application.Doctors.Dtos.WorkScheduleDto>>>, DentalManagement.Application.Doctors.Commands.SetDoctorWorkSchedules.SetDoctorWorkSchedulesCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Doctors.Commands.RemoveWorkSchedule.RemoveWorkScheduleCommand, Result>, DentalManagement.Application.Doctors.Commands.RemoveWorkSchedule.RemoveWorkScheduleCommandHandler>();

        // Clinic Handlers
        services.AddScoped<IQueryHandler<DentalManagement.Application.Clinics.Queries.GetClinics.GetClinicsQuery, Result<DentalManagement.Application.Common.PagedResult<DentalManagement.Application.Clinics.Dtos.ClinicDto>>>, DentalManagement.Application.Clinics.Queries.GetClinics.GetClinicsQueryHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Clinics.Queries.GetClinicById.GetClinicByIdQuery, Result<DentalManagement.Application.Clinics.Dtos.ClinicDto>>, DentalManagement.Application.Clinics.Queries.GetClinicById.GetClinicByIdQueryHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Clinics.Commands.CreateClinic.CreateClinicCommand, Result<DentalManagement.Application.Clinics.Dtos.ClinicDto>>, DentalManagement.Application.Clinics.Commands.CreateClinic.CreateClinicCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Clinics.Commands.UpdateClinic.UpdateClinicCommand, Result<DentalManagement.Application.Clinics.Dtos.ClinicDto>>, DentalManagement.Application.Clinics.Commands.UpdateClinic.UpdateClinicCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Clinics.Commands.DeleteClinic.DeleteClinicCommand, Result>, DentalManagement.Application.Clinics.Commands.DeleteClinic.DeleteClinicCommandHandler>();

        // Inventory Handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Inventory.Items.CreateInventoryItem.CreateInventoryItemCommand, Result<Guid>>, DentalManagement.Application.Inventory.Items.CreateInventoryItem.CreateInventoryItemHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Inventory.Items.UpdateInventoryItem.UpdateInventoryItemCommand, Result>, DentalManagement.Application.Inventory.Items.UpdateInventoryItem.UpdateInventoryItemHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Inventory.Items.ListInventoryItems.ListInventoryItemsQuery, Result<IReadOnlyList<DentalManagement.Application.Inventory.Items.ListInventoryItems.InventoryItemDto>>>, DentalManagement.Application.Inventory.Items.ListInventoryItems.ListInventoryItemsHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Inventory.Batches.ReceiveInventoryBatch.ReceiveInventoryBatchCommand, Result<Guid>>, DentalManagement.Application.Inventory.Batches.ReceiveInventoryBatch.ReceiveInventoryBatchHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Inventory.Batches.ListInventoryBatches.ListInventoryBatchesQuery, Result<IReadOnlyList<DentalManagement.Application.Inventory.Batches.ListInventoryBatches.InventoryBatchDto>>>, DentalManagement.Application.Inventory.Batches.ListInventoryBatches.ListInventoryBatchesHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Inventory.Batches.ConsumeStockFefo.ConsumeStockFefoCommand, Result<IReadOnlyList<DentalManagement.Application.Inventory.Batches.ConsumeStockFefo.BatchConsumptionResultDto>>>, DentalManagement.Application.Inventory.Batches.ConsumeStockFefo.ConsumeStockFefoHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Inventory.Transactions.ListInventoryTransactions.ListInventoryTransactionsQuery, Result<IReadOnlyList<DentalManagement.Application.Inventory.Transactions.ListInventoryTransactions.InventoryTransactionDto>>>, DentalManagement.Application.Inventory.Transactions.ListInventoryTransactions.ListInventoryTransactionsHandler>();

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

        // Promotions / Discounts Handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Promotions.Commands.CreateDiscountPromo.CreateDiscountPromoCommand, Result<Guid>>, DentalManagement.Application.Promotions.Commands.CreateDiscountPromo.CreateDiscountPromoCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Promotions.Commands.UpdateDiscountPromo.UpdateDiscountPromoCommand, Result>, DentalManagement.Application.Promotions.Commands.UpdateDiscountPromo.UpdateDiscountPromoCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Promotions.Commands.ToggleDiscountPromoStatus.ToggleDiscountPromoStatusCommand, Result>, DentalManagement.Application.Promotions.Commands.ToggleDiscountPromoStatus.ToggleDiscountPromoStatusCommandHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Promotions.Commands.DeleteDiscountPromo.DeleteDiscountPromoCommand, Result>, DentalManagement.Application.Promotions.Commands.DeleteDiscountPromo.DeleteDiscountPromoCommandHandler>();

        services.AddScoped<IQueryHandler<DentalManagement.Application.Promotions.Queries.GetDiscountPromosPaged.GetDiscountPromosPagedQuery, Result<PagedResult<DentalManagement.Application.Promotions.Common.DiscountPromoDto>>>, DentalManagement.Application.Promotions.Queries.GetDiscountPromosPaged.GetDiscountPromosPagedQueryHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Promotions.Queries.GetDiscountPromoById.GetDiscountPromoByIdQuery, Result<DentalManagement.Application.Promotions.Common.DiscountPromoDto>>, DentalManagement.Application.Promotions.Queries.GetDiscountPromoById.GetDiscountPromoByIdQueryHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Promotions.Queries.ValidateDiscountPromo.ValidateDiscountPromoQuery, Result<DentalManagement.Application.Promotions.Common.DiscountValidationResultDto>>, DentalManagement.Application.Promotions.Queries.ValidateDiscountPromo.ValidateDiscountPromoQueryHandler>();

        // Treatment Plans Handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Treatments.CreateTreatmentPlan.CreateTreatmentPlanCommand, Result<Guid>>, DentalManagement.Application.Treatments.CreateTreatmentPlan.CreateTreatmentPlanHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Treatments.GetTreatmentPlansByPatient.GetTreatmentPlansByPatientQuery, Result<IReadOnlyList<DentalManagement.Application.Treatments.Common.TreatmentPlanDto>>>, DentalManagement.Application.Treatments.GetTreatmentPlansByPatient.GetTreatmentPlansByPatientHandler>();
        services.AddScoped<ICommandHandler<CreateTreatmentStepCommand, Result<Guid>>, CreateTreatmentStepHandler>();
        services.AddScoped<IQueryHandler<GetTreatmentStepsByPlanQuery, Result<IReadOnlyList<TreatmentStepDto>>>, GetTreatmentStepsByPlanHandler>();
        services.AddScoped<ICommandHandler<UpdateTreatmentStepCommand, Result<bool>>, UpdateTreatmentStepHandler>();
        services.AddScoped<ICommandHandler<ChangeTreatmentStepStatusCommand, Result<bool>>, ChangeTreatmentStepStatusHandler>();
        services.AddScoped<ICommandHandler<DeleteTreatmentStepCommand, Result<bool>>, DeleteTreatmentStepHandler>();

        return services;
    }
}
