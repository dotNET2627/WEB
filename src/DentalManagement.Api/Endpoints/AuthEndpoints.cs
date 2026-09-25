using DentalManagement.Api.Common;
using DentalManagement.Api.Filters;
using DentalManagement.Application.Common;
using DentalManagement.Application.Identity.Commands.Login;
using DentalManagement.Application.Identity.Commands.RefreshToken;
using DentalManagement.Application.Identity.Commands.RevokeToken;
using DentalManagement.Application.Identity.Commands.SwitchClinic;
using DentalManagement.Application.Identity.Queries.GetCurrentUser;
using DentalManagement.Domain.Common;

namespace DentalManagement.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/auth")
            .WithTags("Authentication");

        // 1. Login
        group.MapPost("/login", async (
            LoginRequest request,
            HttpContext httpContext,
            ICommandHandler<LoginCommand, Result<LoginResponseDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();

            var command = new LoginCommand(
                request.Email,
                request.Password,
                request.RememberMe,
                request.ClinicId,
                ipAddress,
                userAgent);

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "auth.account_locked" => Results.Problem(
                        statusCode: StatusCodes.Status423Locked,
                        title: "Tài khoản bị tạm khóa",
                        detail: error.Message),
                    "auth.account_disabled" => Results.Problem(
                        statusCode: StatusCodes.Status403Forbidden,
                        title: "Tài khoản bị vô hiệu hóa",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status401Unauthorized,
                        title: "Đăng nhập thất bại",
                        detail: error.Message)
                };
            }

            var response = result.Value!;

            // Write Refresh Token to HttpOnly Cookie
            AuthCookieHelper.SetRefreshTokenCookie(
                httpContext,
                response.RawRefreshToken,
                response.RefreshTokenExpiresAt,
                response.RememberMe);

            return Results.Ok(new
            {
                accessToken = response.AccessToken,
                expiresIn = response.ExpiresIn,
                user = response.User
            });
        })
        .WithName("Login")
        .RequireRateLimiting("auth-login")
        .AddEndpointFilter<ValidationFilter<LoginRequest>>();

        // 2. Refresh Token
        group.MapPost("/refresh-token", async (
            HttpContext httpContext,
            ICommandHandler<RefreshTokenCommand, Result<RefreshTokenResponseDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var rawToken = AuthCookieHelper.GetRefreshTokenFromCookie(httpContext);
            if (string.IsNullOrWhiteSpace(rawToken))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Thiếu phiên đăng nhập",
                    detail: "Không tìm thấy refresh token trong cookie.");
            }

            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();

            var command = new RefreshTokenCommand(rawToken, ipAddress, userAgent);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                // Delete invalid or reused cookie
                AuthCookieHelper.DeleteRefreshTokenCookie(httpContext);

                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Làm mới phiên thất bại",
                    detail: result.Error!.Message);
            }

            var response = result.Value!;

            // Rotate cookie
            AuthCookieHelper.SetRefreshTokenCookie(
                httpContext,
                response.NewRawRefreshToken,
                response.RefreshTokenExpiresAt,
                rememberMe: true);

            return Results.Ok(new
            {
                accessToken = response.AccessToken,
                expiresIn = response.ExpiresIn
            });
        })
        .WithName("RefreshToken")
        .RequireRateLimiting("auth-refresh");

        // 3. Revoke Token (Logout) - AllowAnonymous so expired access token can still logout
        group.MapPost("/revoke-token", async (
            HttpContext httpContext,
            ICommandHandler<RevokeTokenCommand, Result> handler,
            CancellationToken cancellationToken) =>
        {
            var rawToken = AuthCookieHelper.GetRefreshTokenFromCookie(httpContext);
            if (!string.IsNullOrWhiteSpace(rawToken))
            {
                await handler.Handle(new RevokeTokenCommand(rawToken), cancellationToken);
            }

            AuthCookieHelper.DeleteRefreshTokenCookie(httpContext);
            return Results.Ok(new { message = "Đã đăng xuất thành công." });
        })
        .WithName("RevokeToken")
        .AllowAnonymous();

        // 4. Switch Clinic
        group.MapPost("/switch-clinic", async (
            SwitchClinicRequest request,
            ICommandHandler<SwitchClinicCommand, Result<SwitchClinicResponseDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new SwitchClinicCommand(request.TargetClinicId);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsFailure)
            {
                var error = result.Error!;
                return error.Code switch
                {
                    "auth.clinic_access_denied" => Results.Problem(
                        statusCode: StatusCodes.Status403Forbidden,
                        title: "Truy cập bị từ chối",
                        detail: error.Message),
                    _ => Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Chuyển phòng khám thất bại",
                        detail: error.Message)
                };
            }

            return Results.Ok(result.Value);
        })
        .WithName("SwitchClinic")
        .RequireAuthorization();

        // 5. Get Current User (Me)
        group.MapGet("/me", async (
            IQueryHandler<GetCurrentUserQuery, Result<CurrentUserDto>> handler,
            CancellationToken cancellationToken) =>
        {
            var result = await handler.Handle(new GetCurrentUserQuery(), cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Chưa xác thực",
                    detail: result.Error!.Message);
        })
        .WithName("GetCurrentUser")
        .RequireAuthorization();

        return endpoints;
    }
}

public sealed record LoginRequest(string Email, string Password, bool RememberMe = false, Guid? ClinicId = null);
public sealed record SwitchClinicRequest(Guid TargetClinicId);
