using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Doctors.Dtos;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Doctors;
using FluentValidation;

namespace DentalManagement.Application.Doctors.Commands.UpdateDoctor;

public sealed record UpdateDoctorCommand(
    Guid Id,
    string MedicalLicenseNumber,
    Guid? ClinicId = null,
    int YearsOfExperience = 0,
    string? Specialty = null,
    string? Biography = null,
    IEnumerable<WorkScheduleDto>? WorkSchedules = null);

public sealed class UpdateDoctorCommandValidator : AbstractValidator<UpdateDoctorCommand>
{
    public UpdateDoctorCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID bác sĩ không hợp lệ.");

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

public sealed class UpdateDoctorCommandHandler : ICommandHandler<UpdateDoctorCommand, Result<DoctorDto>>
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClinicRepository _clinicRepository;

    public UpdateDoctorCommandHandler(
        IDoctorRepository doctorRepository,
        IUserRepository userRepository,
        IClinicRepository clinicRepository)
    {
        _doctorRepository = doctorRepository;
        _userRepository = userRepository;
        _clinicRepository = clinicRepository;
    }

    public async Task<Result<DoctorDto>> Handle(UpdateDoctorCommand command, CancellationToken cancellationToken)
    {
        var doctor = await _doctorRepository.GetByIdAsync(command.Id, cancellationToken);
        if (doctor is null)
        {
            return Result<DoctorDto>.Failure("doctor.not_found", "Không tìm thấy thông tin bác sĩ.");
        }

        if (await _doctorRepository.LicenseNumberExistsAsync(command.MedicalLicenseNumber, command.Id, cancellationToken))
        {
            return Result<DoctorDto>.Failure("doctor.duplicate_license", "Số chứng chỉ hành nghề này đã được sử dụng bởi bác sĩ khác.");
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

        doctor.UpdateProfile(
            command.MedicalLicenseNumber,
            command.Specialty,
            command.YearsOfExperience,
            command.Biography,
            command.ClinicId);

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

        await _doctorRepository.ReplaceAsync(doctor, cancellationToken);

        var user = await _userRepository.GetByIdAsync(doctor.UserId, cancellationToken);

        var dto = new DoctorDto(
            doctor.Id,
            doctor.UserId,
            doctor.ClinicId,
            clinicName,
            doctor.MedicalLicenseNumber,
            doctor.YearsOfExperience,
            doctor.Specialty,
            doctor.Biography,
            user?.FullName,
            user?.Email,
            null,
            null,
            doctor.WorkSchedules.Select(s => new WorkScheduleDto(s.ClinicId, s.DayOfWeek, s.StartTime, s.EndTime, s.IsActive)).ToList(),
            doctor.CreatedAt,
            doctor.UpdatedAt);

        return Result<DoctorDto>.Success(dto);
    }
}
