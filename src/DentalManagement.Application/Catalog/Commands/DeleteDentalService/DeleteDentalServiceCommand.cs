using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Commands.DeleteDentalService;

public sealed record DeleteDentalServiceCommand(Guid Id);

public sealed class DeleteDentalServiceCommandHandler : ICommandHandler<DeleteDentalServiceCommand, Result>
{
    private readonly IServiceRepository _serviceRepository;

    public DeleteDentalServiceCommandHandler(IServiceRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    public async Task<Result> Handle(DeleteDentalServiceCommand command, CancellationToken cancellationToken)
    {
        var service = await _serviceRepository.GetByIdAsync(command.Id, cancellationToken);
        if (service is null)
        {
            return Result.Failure("service.not_found", $"Không tìm thấy dịch vụ với id '{command.Id}'.");
        }

        await _serviceRepository.DeleteAsync(command.Id, cancellationToken);
        return Result.Success();
    }
}
