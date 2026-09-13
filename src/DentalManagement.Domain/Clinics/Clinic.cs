using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Clinics;

public sealed class Clinic : AuditableEntity
{
    public Clinic(Guid id, string name, string address)
        : base(id)
    {
        Name = name;
        Address = address;
    }

    public string Name { get; private set; }
    public string Address { get; private set; }
}
