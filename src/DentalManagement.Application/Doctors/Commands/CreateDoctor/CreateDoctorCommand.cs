using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Doctors;
using FluentValidation;

namespace DentalManagement.Application.Doctors.Commands.CreateDoctor;

public sealed record CreateDoctorCommand(
    Guid UserId,
    string MedicalLicenseNumber,
    Guid? ClinicId = null,
    int YearsOfExperience = 0,
    string? Specialty = null,
    string? Biography = null,
    IEnumerable<WorkScheduleDto>? WorkSchedules = null);

public sealed class CreateDoctorCommandValidator : AbstractValidator<CreateDoctorCommand>
{
    public CreateDoctorCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId người dùng không được để trống.");

        RuleFor(x => x.MedicalLicenseNumber)
            .NotEmpty().WithMessage("Số chứng chỉ hành nghề không được để trống.")
            .MaximumLength(100).WithMessage("Số chứng chỉ hành nghề không vượt quá 100 ký tự.");

        RuleFor(x => x.Specialty)
            .MaximumLength(200).WithMessage("Chuyên khoa không vượt quá 200 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Specialty));

        RuleFor(x => x.YearsOfExperience)
            .GreaterThanOrEqualTo(0).WithMessage("Số năm kinh nghiệm không được âm.")
            .LessThanOrEqualTo(70).WithMessage("Số năm kinh nghiệm không hợp lệ.");

        RuleForEach(x => x.WorkSchedules).ChildRules(schedule =>
        {
            schedule.RuleFor(s => s.DayOfWeek)
                .InclusiveBetween(1, 7).WithMessage("Thứ trong tuần phải từ 1 (Chủ nhật) đến 7 (Thứ bảy).");
            schedule.RuleFor(s => s.StartTime)
                .NotEmpty().WithMessage("Giờ bắt đầu không được để trống.")
                .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("Giờ bắt đầu phải có định dạng HH:mm (00:00 - 23:59).");
            schedule.RuleFor(s => s.EndTime)
                .NotEmpty().WithMessage("Giờ kết thúc không được để trống.")
                .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("Giờ kết thúc phải có định dạng HH:mm (00:00 - 23:59).");
        }).When(x => x.WorkSchedules is not null);
    }
}

public sealed class CreateDoctorCommandHandler : ICommandHandler<CreateDoctorCommand, Result<DoctorDto>>
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClinicRepository _clinicRepository;

    public CreateDoctorCommandHandler(
        IDoctorRepository doctorRepository,
        IUserRepository userRepository,
        IClinicRepository clinicRepository)
    {
        _doctorRepository = doctorRepository;
        _userRepository = userRepository;
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<DoctorDto>> Handle(CreateDoctorCommand command, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user is null)
        {
            return Result<DoctorDto>.Failure("doctor.user_not_found", "Không tìm thấy thông tin tài khoản người dùng tương ứng.");
        }

        if (await _doctorRepository.UserIdExistsAsync(command.UserId, null, cancellationToken))
        {
            return Result<DoctorDto>.Failure("doctor.user_already_has_profile", "Người dùng này đã có hồ sơ Bác sĩ trong hệ thống.");
        }

        if (await _doctorRepository.LicenseNumberExistsAsync(command.MedicalLicenseNumber, null, cancellationToken))
        {
            return Result<DoctorDto>.Failure("doctor.duplicate_license", "Số chứng chỉ hành nghề này đã được đăng ký trong hệ thống.");
        }

        string? clinicName = null;
        if (command.ClinicId.HasValue)
        {
            var clinic = await _clinicRepository.GetByIdAsync(command.ClinicId.Value, cancellationToken);
            if (clinic is null)
            {
                return Result<DoctorDto>.Failure("doctor.clinic_not_found", "Không tìm thấy phòng khám được chỉ định.");
            }
            clinicName = clinic.Name;
        }

        var doctor = new Doctor(
            Guid.NewGuid(),
            command.UserId,
            command.MedicalLicenseNumber,
            command.ClinicId,
            command.YearsOfExperience,
            command.Specialty,
            command.Biography);

        if (command.WorkSchedules is not null)
        {
            var schedules = command.WorkSchedules.Select(s => WorkScheduleItem.Create(
                s.ClinicId ?? command.ClinicId,
                s.DayOfWeek,
                s.StartTime,
                s.EndTime,
                s.IsActive));
            doctor.SetWorkSchedules(schedules);
        }

        await _doctorRepository.AddAsync(doctor, cancellationToken);

        var dto = new DoctorDto(
            doctor.Id,
            doctor.UserId,
            doctor.ClinicId,
            clinicName,
            doctor.MedicalLicenseNumber,
            doctor.YearsOfExperience,
            doctor.Specialty,
            doctor.Biography,
            user.FullName,
            user.Email,
            null,
            null,
            doctor.WorkSchedules.Select(s => new WorkScheduleDto(s.ClinicId, s.DayOfWeek, s.StartTime, s.EndTime, s.IsActive)).ToList(),
            doctor.CreatedAt,
            doctor.UpdatedAt);

        return Result<DoctorDto>.Success(dto);
    }
}
