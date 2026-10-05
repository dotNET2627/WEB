using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Security;
using DentalManagement.Domain.Clinics;
using DentalManagement.Domain.Doctors;
using DentalManagement.Domain.Identity;

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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi khởi tạo dữ liệu mẫu ban đầu.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
