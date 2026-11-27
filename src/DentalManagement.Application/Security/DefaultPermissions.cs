namespace DentalManagement.Application.Security;

public static class DefaultPermissions
{
    public static class Patients
    {
        public const string Read = "patients.read";
        public const string Create = "patients.create";
        public const string Update = "patients.update";
        public const string Delete = "patients.delete";
    }

    public static class Appointments
    {
        public const string Read = "appointments.read";
        public const string Create = "appointments.create";
        public const string Update = "appointments.update";
        public const string Cancel = "appointments.cancel";
        public const string CheckIn = "appointments.checkin";
    }

    public static class Reception
    {
        public const string Read = "reception.read";
    }

    public static class Invoices
    {
        public const string Read = "invoices.read";
        public const string Create = "invoices.create";
        public const string Pay = "invoices.pay";
    }

    public static class Prescriptions
    {
        public const string Read = "prescriptions.read";
        public const string Create = "prescriptions.create";
        public const string Dispense = "prescriptions.dispense";
    }

    public static class Inventory
    {
        public const string Read = "inventory.read";
        public const string Import = "inventory.import";
        public const string Export = "inventory.export";
        public const string Adjust = "inventory.adjust";
    }

    public static class Clinics
    {
        public const string Read = "clinics.read";
        public const string Create = "clinics.create";
        public const string Update = "clinics.update";
        public const string Delete = "clinics.delete";
    }

    public static class Doctors
    {
        public const string Read = "doctors.read";
        public const string Create = "doctors.create";
        public const string Update = "doctors.update";
        public const string Delete = "doctors.delete";
    }

    public static class Insurance
    {
        public const string Read = "insurance.read";
        public const string Create = "insurance.create";
        public const string Update = "insurance.update";
    }

    public static class CashierShifts
    {
        public const string Read = "shifts.read";
        public const string Manage = "shifts.manage";
    }

    public static class System
    {
        public const string ViewReports = "reports.view";
        public const string ManageSettings = "settings.manage";
    }

    public static readonly IReadOnlyList<string> All =
    [
        Clinics.Read, Clinics.Create, Clinics.Update, Clinics.Delete,
        Doctors.Read, Doctors.Create, Doctors.Update, Doctors.Delete,
        Patients.Read, Patients.Create, Patients.Update, Patients.Delete,
        Appointments.Read, Appointments.Create, Appointments.Update, Appointments.Cancel, Appointments.CheckIn,
        Reception.Read,
        Invoices.Read, Invoices.Create, Invoices.Pay,
        Prescriptions.Read, Prescriptions.Create, Prescriptions.Dispense,
        Inventory.Read, Inventory.Import, Inventory.Export, Inventory.Adjust,
        Insurance.Read, Insurance.Create, Insurance.Update,
        CashierShifts.Read, CashierShifts.Manage,
        System.ViewReports, System.ManageSettings
    ];
}
