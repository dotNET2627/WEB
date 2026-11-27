using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Catalog.Commands.ToggleDentalServiceStatus;

public sealed record ToggleDentalServiceStatusCommand(Guid Id, bool? IsActive = null);

public sealed class ToggleDentalServiceStatusCommandHandler : ICommandHandler<ToggleDentalServiceStatusCommand, Result>
{
    private readonly IServiceRepository _serviceRepository;

    public ToggleDentalServiceStatusCommandHandler(IServiceRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    public async Task<Result> Handle(ToggleDentalServiceStatusCommand command, CancellationToken cancellationToken)
    {
        var service = await _serviceRepository.GetByIdAsync(command.Id, cancellationToken);
        if (service is null)
        {
            return Result.Failure("service.not_found", $"Không tìm thấy dịch vụ với id '{command.Id}'.");
        }

        Result statusResult;
        if (command.IsActive.HasValue)
        {
            if (command.IsActive.Value == service.IsActive)
            {
                return Result.Success();
            }

            statusResult = command.IsActive.Value ? service.Activate() : service.Deactivate();
        }
        else
        {
            statusResult = service.IsActive ? service.Deactivate() : service.Activate();
        }

        if (statusResult.IsFailure)
        {
            return statusResult;
        }

        await _serviceRepository.ReplaceAsync(service, cancellationToken);
        return Result.Success();
    }
}
