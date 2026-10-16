using DentalManagement.Application.Abstractions.Services;

namespace DentalManagement.Api.Extensions;

public static class EndpointConventionBuilderExtensions
{
    /// <summary>
    /// Rejects requests from accounts that have not selected a clinic (403).
    /// Applies to every endpoint in the group it is called on.
    /// </summary>
    public static TBuilder RequireClinic<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.AddEndpointFilter(async (context, next) =>
        {
            var user = context.HttpContext.RequestServices
                .GetRequiredService<ICurrentUser>();

            if (user.ClinicId is not { } clinicId || clinicId == Guid.Empty)
            {
                return Results.Problem(
                    statusCode: 403,
                    title: "Chưa chọn phòng khám",
                    detail: "Hãy đăng nhập hoặc chuyển sang phòng khám có quyền truy cập.");
            }

            return await next(context);
        });

        return builder;
    }
}
