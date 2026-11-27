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
        services.AddScoped<IQueryHandler<DentalManagement.Application.Inventory.Alerts.GetInventoryAlerts.GetInventoryAlertsQuery, Result<DentalManagement.Application.Inventory.Alerts.GetInventoryAlerts.InventoryAlertsDto>>, DentalManagement.Application.Inventory.Alerts.GetInventoryAlerts.GetInventoryAlertsHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Inventory.Suppliers.ListSuppliersQuery, Result<IReadOnlyList<DentalManagement.Application.Inventory.Suppliers.SupplierDto>>>, DentalManagement.Application.Inventory.Suppliers.ListSuppliersHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Inventory.Suppliers.CreateSupplierCommand, Result<Guid>>, DentalManagement.Application.Inventory.Suppliers.CreateSupplierHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Inventory.Suppliers.UpdateSupplierCommand, Result>, DentalManagement.Application.Inventory.Suppliers.UpdateSupplierHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Inventory.Audits.AuditBatchStockCommand, Result<DentalManagement.Application.Inventory.Audits.AuditBatchStockResultDto>>, DentalManagement.Application.Inventory.Audits.AuditBatchStockHandler>();

        // Prescription Handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Prescriptions.CreatePrescription.CreatePrescriptionCommand, Result<Guid>>, DentalManagement.Application.Prescriptions.CreatePrescription.CreatePrescriptionHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Prescriptions.ListPrescriptions.ListPrescriptionsQuery, Result<IReadOnlyList<DentalManagement.Application.Prescriptions.ListPrescriptions.PrescriptionDto>>>, DentalManagement.Application.Prescriptions.ListPrescriptions.ListPrescriptionsHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Prescriptions.DispensePrescription.DispensePrescriptionCommand, Result<DentalManagement.Application.Prescriptions.DispensePrescription.DispensePrescriptionResultDto>>, DentalManagement.Application.Prescriptions.DispensePrescription.DispensePrescriptionHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Prescriptions.CancelPrescription.CancelPrescriptionCommand, Result>, DentalManagement.Application.Prescriptions.CancelPrescription.CancelPrescriptionHandler>();

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

        // Invoice handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Invoices.CreateInvoice.CreateInvoiceCommand, Result<Guid>>, DentalManagement.Application.Invoices.CreateInvoice.CreateInvoiceHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Invoices.GetInvoice.GetInvoiceQuery, Result<DentalManagement.Application.Invoices.GetInvoice.InvoiceDto>>, DentalManagement.Application.Invoices.GetInvoice.GetInvoiceHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Invoices.ListInvoices.ListInvoicesQuery, Result<IReadOnlyList<DentalManagement.Application.Invoices.ListInvoices.InvoiceSummaryDto>>>, DentalManagement.Application.Invoices.ListInvoices.ListInvoicesHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Invoices.RecordPayment.RecordPaymentCommand, Result>, DentalManagement.Application.Invoices.RecordPayment.RecordPaymentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Invoices.CancelInvoice.CancelInvoiceCommand, Result>, DentalManagement.Application.Invoices.CancelInvoice.CancelInvoiceHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Invoices.VietQr.GetInvoiceVietQrQuery, Result<DentalManagement.Application.Invoices.VietQr.InvoiceVietQrDto>>, DentalManagement.Application.Invoices.VietQr.GetInvoiceVietQrHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Invoices.Reports.GetFinancialReport.GetFinancialReportQuery, Result<DentalManagement.Application.Invoices.Reports.GetFinancialReport.FinancialReportDto>>, DentalManagement.Application.Invoices.Reports.GetFinancialReport.GetFinancialReportHandler>();

        // Insurance Claim handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Insurance.CreateClaim.CreateInsuranceClaimCommand, Result<Guid>>, DentalManagement.Application.Insurance.CreateClaim.CreateInsuranceClaimHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Insurance.GetClaim.GetInsuranceClaimQuery, Result<DentalManagement.Application.Insurance.GetClaim.InsuranceClaimDto>>, DentalManagement.Application.Insurance.GetClaim.GetInsuranceClaimHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Insurance.ListClaims.ListInsuranceClaimsQuery, Result<IReadOnlyList<DentalManagement.Application.Insurance.ListClaims.InsuranceClaimSummaryDto>>>, DentalManagement.Application.Insurance.ListClaims.ListInsuranceClaimsHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Insurance.UpdateClaimStatus.UpdateInsuranceClaimStatusCommand, Result>, DentalManagement.Application.Insurance.UpdateClaimStatus.UpdateInsuranceClaimStatusHandler>();

        // Cashier Shift handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Billing.Shifts.OpenShift.OpenCashierShiftCommand, Result<Guid>>, DentalManagement.Application.Billing.Shifts.OpenShift.OpenCashierShiftHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Billing.Shifts.GetCurrentShift.GetCurrentCashierShiftQuery, Result<DentalManagement.Application.Billing.Shifts.CashierShiftDto?>>, DentalManagement.Application.Billing.Shifts.GetCurrentShift.GetCurrentCashierShiftHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Billing.Shifts.CloseShift.CloseCashierShiftCommand, Result>, DentalManagement.Application.Billing.Shifts.CloseShift.CloseCashierShiftHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Billing.Shifts.ListShifts.ListCashierShiftsQuery, Result<IReadOnlyList<DentalManagement.Application.Billing.Shifts.CashierShiftSummaryDto>>>, DentalManagement.Application.Billing.Shifts.ListShifts.ListCashierShiftsHandler>();

        // Check-in workflow handlers
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.CheckInAppointment.CheckInAppointmentCommand, Result>, DentalManagement.Application.Appointments.CheckInAppointment.CheckInAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.StartExam.StartExamCommand, Result>, DentalManagement.Application.Appointments.StartExam.StartExamHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.CompleteAppointment.CompleteAppointmentCommand, Result>, DentalManagement.Application.Appointments.CompleteAppointment.CompleteAppointmentHandler>();
        services.AddScoped<ICommandHandler<DentalManagement.Application.Appointments.MarkNoShow.MarkNoShowCommand, Result>, DentalManagement.Application.Appointments.MarkNoShow.MarkNoShowHandler>();
        services.AddScoped<IQueryHandler<DentalManagement.Application.Appointments.GetTodayAppointments.GetTodayAppointmentsQuery, Result<IReadOnlyList<DentalManagement.Application.Appointments.GetTodayAppointments.TodayAppointmentDto>>>, DentalManagement.Application.Appointments.GetTodayAppointments.GetTodayAppointmentsHandler>();

        return services;
    }
}
