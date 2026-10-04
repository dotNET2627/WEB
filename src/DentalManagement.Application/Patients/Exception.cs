namespace DentalManagement.Application.Patients;

public sealed class DuplicatePatientCodeException(Exception innerException)
    : Exception("Mã bệnh nhân đã tồn tại trong phòng khám.", innerException);
