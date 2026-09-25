using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Security;
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

                var doctorRole = new Role(Guid.NewGuid(), "Doctor", "Bác sĩ điều trị", isSystem: true);
                doctorRole.SetPermissions([
                    DefaultPermissions.Patients.Read,
                    DefaultPermissions.Patients.Update,
                    DefaultPermissions.Appointments.Read,
                    DefaultPermissions.Appointments.Create,
                    DefaultPermissions.Appointments.Update,
                    DefaultPermissions.Prescriptions.Read,
                    DefaultPermissions.Prescriptions.Create
                ]);
                await roleRepo.AddAsync(doctorRole, cancellationToken);

                var receptionistRole = new Role(Guid.NewGuid(), "Receptionist", "Lễ tân phòng khám", isSystem: true);
                receptionistRole.SetPermissions([
                    DefaultPermissions.Patients.Read,
                    DefaultPermissions.Patients.Create,
                    DefaultPermissions.Appointments.Read,
                    DefaultPermissions.Appointments.Create,
                    DefaultPermissions.Invoices.Read,
                    DefaultPermissions.Invoices.Create,
                    DefaultPermissions.Invoices.Pay
                ]);
                await roleRepo.AddAsync(receptionistRole, cancellationToken);

                _logger.LogInformation("Đã khởi tạo các Role mặc định: SuperAdmin, Doctor, Receptionist.");
            }

            var adminEmail = "admin@clinic.vn";
            var existingUser = await userRepo.GetByEmailAsync(adminEmail, cancellationToken);
            if (existingUser is null)
            {
                var adminUser = new User(
                    Guid.NewGuid(),
                    adminEmail,
                    "Quản Trị Viên Hệ Thống",
                    passwordHasher.Hash("Password123!"));

                adminUser.AssignRole(superAdminRole!.Id, clinicId: null, assignedBy: null, clock.UtcNow);
                await userRepo.AddAsync(adminUser, cancellationToken);

                _logger.LogInformation("Đã khởi tạo tài khoản Admin mặc định: {Email} / Password123!", adminEmail);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi khởi tạo dữ liệu mẫu ban đầu.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
