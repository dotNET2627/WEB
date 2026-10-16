using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Appointments;
using DentalManagement.Domain.Clinics;
using DentalManagement.Domain.Doctors;
using DentalManagement.Domain.Identity;
using DentalManagement.Domain.Patients;

namespace DentalManagement.Api.HostedServices;

public sealed class DatabaseSeedHostedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseSeedHostedService> _logger;

    public DatabaseSeedHostedService(
        IServiceProvider serviceProvider,
        ILogger<DatabaseSeedHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var roleRepo = scope.ServiceProvider.GetRequiredService<IRoleRepository>();
        var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var clock = scope.ServiceProvider.GetRequiredService<IClock>();

        try
        {
            var existingRoles = await roleRepo.GetAllAsync(cancellationToken);
            Role? superAdminRole = existingRoles.FirstOrDefault(r => r.Name == "SuperAdmin");

            if (superAdminRole is null)
            {
                superAdminRole = new Role(Guid.NewGuid(), "SuperAdmin", "Quản trị viên toàn hệ thống", isSystem: true);
                superAdminRole.SetPermissions(DefaultPermissions.All);
                await roleRepo.AddAsync(superAdminRole, cancellationToken);
                _logger.LogInformation("Đã khởi tạo Role SuperAdmin mặc định.");
            }
            else
            {
                // Always sync SuperAdmin permissions to include newly added module permissions
                superAdminRole.SetPermissions(DefaultPermissions.All);
                await roleRepo.UpdateAsync(superAdminRole, cancellationToken);
                _logger.LogInformation("Đã cập nhật quyền hạn SuperAdmin lên DefaultPermissions.All.");
            }

            Role? doctorRole = existingRoles.FirstOrDefault(r => r.Name == "Doctor");
            if (doctorRole is null)
            {
                doctorRole = new Role(Guid.NewGuid(), "Doctor", "Bác sĩ điều trị", isSystem: true);
                doctorRole.SetPermissions([
                    DefaultPermissions.Doctors.Read,
                    DefaultPermissions.Clinics.Read,
                    DefaultPermissions.Patients.Read,
                    DefaultPermissions.Patients.Update,
                    DefaultPermissions.Appointments.Read,
                    DefaultPermissions.Appointments.Create,
                    DefaultPermissions.Appointments.Update,
                    DefaultPermissions.Prescriptions.Read,
                    DefaultPermissions.Prescriptions.Create
                ]);
                await roleRepo.AddAsync(doctorRole, cancellationToken);
                _logger.LogInformation("Đã khởi tạo Role Doctor mặc định.");
            }
            else
            {
                doctorRole.AddPermission(DefaultPermissions.Doctors.Read);
                doctorRole.AddPermission(DefaultPermissions.Clinics.Read);
                await roleRepo.UpdateAsync(doctorRole, cancellationToken);
            }

            Role? receptionistRole = existingRoles.FirstOrDefault(r => r.Name == "Receptionist");
            if (receptionistRole is null)
            {
                receptionistRole = new Role(Guid.NewGuid(), "Receptionist", "Lễ tân phòng khám", isSystem: true);
                receptionistRole.SetPermissions([
                    DefaultPermissions.Doctors.Read,
                    DefaultPermissions.Clinics.Read,
                    DefaultPermissions.Patients.Read,
                    DefaultPermissions.Patients.Create,
                    DefaultPermissions.Appointments.Read,
                    DefaultPermissions.Appointments.Create,
                    DefaultPermissions.Invoices.Read,
                    DefaultPermissions.Invoices.Create,
                    DefaultPermissions.Invoices.Pay
                ]);
                await roleRepo.AddAsync(receptionistRole, cancellationToken);
                _logger.LogInformation("Đã khởi tạo Role Receptionist mặc định.");
            }
            else
            {
                receptionistRole.AddPermission(DefaultPermissions.Doctors.Read);
                receptionistRole.AddPermission(DefaultPermissions.Clinics.Read);
                await roleRepo.UpdateAsync(receptionistRole, cancellationToken);
            }

            var clinicRepo = scope.ServiceProvider.GetRequiredService<IClinicRepository>();
            var doctorRepo = scope.ServiceProvider.GetRequiredService<IDoctorRepository>();

            // Seed default Clinic if none exists
            var existingClinics = await clinicRepo.GetPagedAsync(1, 1, null, null, cancellationToken);
            Clinic defaultClinic;
            if (existingClinics.TotalCount == 0)
            {
                var hours = new Dictionary<string, string>
                {
                    ["monday"] = "08:00 - 20:00",
                    ["tuesday"] = "08:00 - 20:00",
                    ["wednesday"] = "08:00 - 20:00",
                    ["thursday"] = "08:00 - 20:00",
                    ["friday"] = "08:00 - 20:00",
                    ["saturday"] = "08:00 - 17:30",
                    ["sunday"] = "Đóng cửa"
                };

                defaultClinic = new Clinic(
                    Guid.NewGuid(),
                    "Nha khoa DentalCare - Chi nhánh Trung tâm",
                    "123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
                    "028 3822 1999",
                    "central@clinic.vn",
                    "Cơ sở điều trị răng hàm mặt chất lượng cao, trang bị phòng chụp CT Cone Beam 3D và vô trùng chuẩn.",
                    hours,
                    logo: null,
                    isActive: true);

                await clinicRepo.AddAsync(defaultClinic, cancellationToken);
                _logger.LogInformation("Đã khởi tạo Chi nhánh mặc định: {ClinicName}", defaultClinic.Name);
            }
            else
            {
                defaultClinic = existingClinics.Items.First();
            }

            var adminEmail = "admin@clinic.vn";
            var existingUser = await userRepo.GetByEmailAsync(adminEmail, cancellationToken);
            User adminUser;
            if (existingUser is null)
            {
                adminUser = new User(
                    Guid.NewGuid(),
                    adminEmail,
                    "Quản Trị Viên Hệ Thống",
                    passwordHasher.Hash("Password123!"),
                    defaultClinic.Id);

                adminUser.AssignRole(superAdminRole!.Id, clinicId: null, assignedBy: null, clock.UtcNow);
                adminUser.AssignRole(superAdminRole!.Id, clinicId: defaultClinic.Id, assignedBy: null, clock.UtcNow);
                await userRepo.AddAsync(adminUser, cancellationToken);

                _logger.LogInformation("Đã khởi tạo tài khoản Admin mặc định: {Email} / Password123!", adminEmail);
            }
            else
            {
                adminUser = existingUser;
                if (!adminUser.DefaultClinicId.HasValue || adminUser.DefaultClinicId.Value == Guid.Empty)
                {
                    adminUser.SetDefaultClinic(defaultClinic.Id);
                    adminUser.AssignRole(superAdminRole!.Id, clinicId: defaultClinic.Id, assignedBy: null, clock.UtcNow);
                    await userRepo.UpdateAsync(adminUser, cancellationToken);
                }
            }

            // Seed sample doctors if none exist
            var existingDoctors = await doctorRepo.GetPagedAsync(1, 1, null, null, null, cancellationToken);
            if (existingDoctors.TotalCount == 0)
            {
                // Doctor 1: Cấy ghép Implant
                var doc1Email = "bs.minhtri@clinic.vn";
                var doc1User = await userRepo.GetByEmailAsync(doc1Email, cancellationToken);
                if (doc1User is null)
                {
                    doc1User = new User(
                        Guid.NewGuid(),
                        doc1Email,
                        "BS. CKI Trần Minh Trí",
                        passwordHasher.Hash("Password123!"),
                        defaultClinic.Id);
                    doc1User.AssignRole(doctorRole!.Id, defaultClinic.Id, adminUser.Id, clock.UtcNow);
                    await userRepo.AddAsync(doc1User, cancellationToken);
                }

                var doc1 = new Doctor(
                    Guid.NewGuid(),
                    doc1User.Id,
                    "012845/BYT-CCHN",
                    defaultClinic.Id,
                    yearsOfExperience: 12,
                    specialty: "Cấy ghép Implant",
                    biography: "Tốt nghiệp Đại học Y Dược TP.HCM, Chuyên khoa I Răng Hàm Mặt. Hơn 12 năm kinh nghiệm lâm sàng chuyên sâu cấy ghép Implant và phục hình tức thì.");
                doc1.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 2, "08:00", "12:00"));
                doc1.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 2, "13:30", "17:30"));
                doc1.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 4, "08:00", "12:00"));
                doc1.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 4, "13:30", "17:30"));
                doc1.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 6, "08:00", "12:00"));
                await doctorRepo.AddAsync(doc1, cancellationToken);

                // Doctor 2: Chỉnh nha - Niềng răng
                var doc2Email = "bs.thanhhuong@clinic.vn";
                var doc2User = await userRepo.GetByEmailAsync(doc2Email, cancellationToken);
                if (doc2User is null)
                {
                    doc2User = new User(
                        Guid.NewGuid(),
                        doc2Email,
                        "ThS. BS Lê Thanh Hương",
                        passwordHasher.Hash("Password123!"),
                        defaultClinic.Id);
                    doc2User.AssignRole(doctorRole!.Id, defaultClinic.Id, adminUser.Id, clock.UtcNow);
                    await userRepo.AddAsync(doc2User, cancellationToken);
                }

                var doc2 = new Doctor(
                    Guid.NewGuid(),
                    doc2User.Id,
                    "024190/BYT-CCHN",
                    defaultClinic.Id,
                    yearsOfExperience: 8,
                    specialty: "Chỉnh nha - Niềng răng",
                    biography: "Thạc sĩ Chỉnh nha, chứng chỉ chuyên gia niềng răng khay trong suốt Invisalign Platinum Provider. Đã hoàn thiện hơn 1.000 ca niềng răng.");
                doc2.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 3, "08:30", "12:00"));
                doc2.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 3, "13:30", "18:00"));
                doc2.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 5, "08:30", "12:00"));
                doc2.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 5, "13:30", "18:00"));
                doc2.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 7, "08:30", "16:30"));
                await doctorRepo.AddAsync(doc2, cancellationToken);

                // Doctor 3: Nha chu & Điều trị tủy
                var doc3Email = "bs.hoangnam@clinic.vn";
                var doc3User = await userRepo.GetByEmailAsync(doc3Email, cancellationToken);
                if (doc3User is null)
                {
                    doc3User = new User(
                        Guid.NewGuid(),
                        doc3Email,
                        "BS. Nguyễn Hoàng Nam",
                        passwordHasher.Hash("Password123!"),
                        defaultClinic.Id);
                    doc3User.AssignRole(doctorRole!.Id, defaultClinic.Id, adminUser.Id, clock.UtcNow);
                    await userRepo.AddAsync(doc3User, cancellationToken);
                }

                var doc3 = new Doctor(
                    Guid.NewGuid(),
                    doc3User.Id,
                    "031572/BYT-CCHN",
                    defaultClinic.Id,
                    yearsOfExperience: 6,
                    specialty: "Nha chu & Điều trị tủy",
                    biography: "Bác sĩ chuyên sâu nội nha vi phẫu và điều trị bệnh lý nha chu. Ứng dụng kỹ thuật bảo tồn răng thật và thẩm mỹ nướu.");
                doc3.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 2, "13:30", "20:00"));
                doc3.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 4, "13:30", "20:00"));
                doc3.AddWorkSchedule(WorkScheduleItem.Create(defaultClinic.Id, 1, "08:00", "12:00"));
                await doctorRepo.AddAsync(doc3, cancellationToken);

                _logger.LogInformation("Đã khởi tạo 3 Bác sĩ mẫu kèm hồ sơ chuyên môn và lịch trực tuần hoàn.");
            }

            // Seed Receptionist user
            var receptionistEmail = "letan@clinic.vn";
            var existingReceptionist = await userRepo.GetByEmailAsync(receptionistEmail, cancellationToken);
            if (existingReceptionist is null)
            {
                var receptionistUser = new User(
                    Guid.NewGuid(),
                    receptionistEmail,
                    "Nhân Viên Lễ Tân Thử Nghiệm",
                    passwordHasher.Hash("Password123!"),
                    defaultClinic.Id);
                receptionistUser.AssignRole(receptionistRole!.Id, defaultClinic.Id, adminUser.Id, clock.UtcNow);
                await userRepo.AddAsync(receptionistUser, cancellationToken);
                _logger.LogInformation("Đã khởi tạo tài khoản Lễ tân mẫu: {Email} / Password123!", receptionistEmail);
            }

            // Seed sample patients
            var patientRepo = scope.ServiceProvider.GetRequiredService<IPatientRepository>();
            var existingPatients = await patientRepo.GetPageAsync(defaultClinic.Id, new PagedQuery(1, 1), null, cancellationToken);
            Patient patient1;
            Patient patient2;
            Patient patient3;

            if (existingPatients.TotalCount == 0)
            {
                patient1 = new Patient(Guid.NewGuid(), defaultClinic.Id, "Bệnh nhân thử 001", "BN-2026-0001");
                patient1.UpdateContact("Bệnh nhân thử 001", "0900 000 001", new DateOnly(1990, 5, 15));
                patient1.AddMedicalHistory(new MedicalHistoryItem("allergy", "Penicillin", "high", "Dị ứng nổi mề đay và khó thở khi dùng kháng sinh Beta-lactam", clock.UtcNow));
                patient1.AddMedicalHistory(new MedicalHistoryItem("condition", "Tăng huyết áp", "moderate", "Huyết áp ổn định 135/85 mmHg khi dùng Amlodipine 5mg", clock.UtcNow));
                patient1.UpsertToothCondition(new ToothCondition(16, ToothConditionType.Caries, [ToothSurface.O], "Sâu rãnh mặt nhai độ 1", clock.UtcNow, "BS. CKI Trần Minh Trí"));
                patient1.UpsertToothCondition(new ToothCondition(36, ToothConditionType.Crown, [ToothSurface.M, ToothSurface.O, ToothSurface.D], "Mão toàn sứ Zirconia sau điều trị tủy", clock.UtcNow, "BS. CKI Trần Minh Trí"));
                await patientRepo.AddAsync(patient1, cancellationToken);

                patient2 = new Patient(Guid.NewGuid(), defaultClinic.Id, "Bệnh nhân thử 002", "BN-2026-0002");
                patient2.UpdateContact("Bệnh nhân thử 002", "0900 000 002", new DateOnly(1985, 11, 20));
                patient2.AddMedicalHistory(new MedicalHistoryItem("medication", "Aspirin 81mg", "moderate", "Thuốc chống đông máu tim mạch, cần hội chẩn trước phẫu thuật", clock.UtcNow));
                patient2.UpsertToothCondition(new ToothCondition(21, ToothConditionType.Caries, [ToothSurface.B, ToothSurface.M], "Mẻ góc cắn và sâu men mặt ngoài", clock.UtcNow, "ThS. BS Lê Thanh Hương"));
                await patientRepo.AddAsync(patient2, cancellationToken);

                patient3 = new Patient(Guid.NewGuid(), defaultClinic.Id, "Bệnh nhân thử 003", "BN-2026-0003");
                patient3.UpdateContact("Bệnh nhân thử 003", "0900 000 003", new DateOnly(2002, 8, 3));
                patient3.AddMedicalHistory(new MedicalHistoryItem("none", "Chưa ghi nhận dị ứng", null, "Đã khai thác bệnh sử và khám sàng lọc", clock.UtcNow));
                patient3.UpsertToothCondition(new ToothCondition(48, ToothConditionType.Extracted, [], "Răng khôn hàm dưới mọc lệch kẹt đã nhổ tiểu phẫu", clock.UtcNow, "BS. Nguyễn Hoàng Nam"));
                await patientRepo.AddAsync(patient3, cancellationToken);

                _logger.LogInformation("Đã khởi tạo 3 Bệnh nhân mẫu với tiền sử bệnh lý và sơ đồ răng FDI.");
            }
            else
            {
                var patientList = await patientRepo.GetPageAsync(defaultClinic.Id, new PagedQuery(1, 3), null, cancellationToken);
                patient1 = patientList.Items.ElementAtOrDefault(0) ?? new Patient(Guid.NewGuid(), defaultClinic.Id, "Bệnh nhân thử 001");
                patient2 = patientList.Items.ElementAtOrDefault(1) ?? patient1;
                patient3 = patientList.Items.ElementAtOrDefault(2) ?? patient1;
            }

            // Seed sample appointments
            var appointmentRepo = scope.ServiceProvider.GetRequiredService<IAppointmentRepository>();
            var existingAppts = await appointmentRepo.GetByDateRangeAsync(
                clock.UtcNow.AddDays(-30),
                clock.UtcNow.AddDays(30),
                null,
                cancellationToken);

            if (existingAppts.Count == 0)
            {
                var allDoctors = await doctorRepo.GetPagedAsync(1, 10, defaultClinic.Id, null, null, cancellationToken);
                var doc1Item = allDoctors.Items.ElementAtOrDefault(0);
                var doc2Item = allDoctors.Items.ElementAtOrDefault(1) ?? doc1Item;
                var doc3Item = allDoctors.Items.ElementAtOrDefault(2) ?? doc1Item;

                if (doc1Item is not null)
                {
                    var today = clock.UtcNow.Date;

                    // Lịch 1: Hôm nay 09:00 - Cấy ghép Implant (Confirmed)
                    var appt1Start = today.AddHours(9);
                    var appt1 = Appointment.Rehydrate(
                        Guid.NewGuid(),
                        patient1.Id,
                        doc1Item.Id,
                        defaultClinic.Id,
                        appt1Start,
                        appt1Start.AddHours(1),
                        AppointmentStatus.Confirmed,
                        "Cấy ghép Implant Straumann đơn lẻ răng 36",
                        clock.UtcNow,
                        clock.UtcNow,
                        [new PlannedService(Guid.NewGuid(), "Cấy ghép Implant Straumann đơn lẻ", 28000000m, "36")]);
                    await appointmentRepo.AddAsync(appt1, cancellationToken);

                    // Lịch 2: Hôm nay 14:00 - Niềng răng (Pending)
                    var appt2Start = today.AddHours(14);
                    var appt2 = Appointment.Rehydrate(
                        Guid.NewGuid(),
                        patient2.Id,
                        doc2Item!.Id,
                        defaultClinic.Id,
                        appt2Start,
                        appt2Start.AddMinutes(45),
                        AppointmentStatus.Pending,
                        "Tư vấn niềng răng khay trong suốt Invisalign",
                        clock.UtcNow,
                        clock.UtcNow,
                        [new PlannedService(Guid.NewGuid(), "Khám & Tư vấn chỉnh nha máng trong suốt", 500000m, null)]);
                    await appointmentRepo.AddAsync(appt2, cancellationToken);

                    // Lịch 3: Ngày mai 10:00 - Khám tổng quát & Lấy cao răng (Confirmed)
                    var appt3Start = today.AddDays(1).AddHours(10);
                    var appt3 = Appointment.Rehydrate(
                        Guid.NewGuid(),
                        patient3.Id,
                        doc3Item!.Id,
                        defaultClinic.Id,
                        appt3Start,
                        appt3Start.AddMinutes(30),
                        AppointmentStatus.Confirmed,
                        "Khám tổng quát và lấy cao răng toàn hàm",
                        clock.UtcNow,
                        clock.UtcNow,
                        [new PlannedService(Guid.NewGuid(), "Cạo vôi răng & Đánh bóng toàn hàm", 350000m, null)]);
                    await appointmentRepo.AddAsync(appt3, cancellationToken);

                    // Lịch 4: Hôm qua 15:00 - Trám răng (Completed)
                    var appt4Start = today.AddDays(-1).AddHours(15);
                    var appt4 = Appointment.Rehydrate(
                        Guid.NewGuid(),
                        patient1.Id,
                        doc3Item.Id,
                        defaultClinic.Id,
                        appt4Start,
                        appt4Start.AddMinutes(45),
                        AppointmentStatus.Completed,
                        "Trám răng thẩm mỹ Composite răng 16",
                        clock.UtcNow.AddDays(-1),
                        clock.UtcNow.AddDays(-1),
                        [new PlannedService(Guid.NewGuid(), "Trám răng thẩm mỹ Composite", 450000m, "16")]);
                    await appointmentRepo.AddAsync(appt4, cancellationToken);

                    _logger.LogInformation("Đã khởi tạo 4 Lịch hẹn mẫu phân bổ cho các bác sĩ và bệnh nhân.");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi khởi tạo dữ liệu mẫu ban đầu.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
