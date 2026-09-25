namespace DentalManagement.Api.Common;

public static class AuthCookieHelper
{
    public const string CookieName = "refreshToken";
    public const string CookiePath = "/api/v1/auth";

    public static void SetRefreshTokenCookie(
        HttpContext context,
        string rawRefreshToken,
        DateTimeOffset expiresAt,
        bool rememberMe)
    {
        var isLocal = context.Request.Host.Host is "localhost" or "127.0.0.1";
        var secure = context.Request.IsHttps || !isLocal;

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Strict,
            Path = CookiePath,
            Expires = rememberMe ? expiresAt : null
        };

        context.Response.Cookies.Append(CookieName, rawRefreshToken, cookieOptions);
    }

    public static void DeleteRefreshTokenCookie(HttpContext context)
    {
        var isLocal = context.Request.Host.Host is "localhost" or "127.0.0.1";
        var secure = context.Request.IsHttps || !isLocal;

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Strict,
            Path = CookiePath,
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        };

        context.Response.Cookies.Delete(CookieName, cookieOptions);
    }

    public static string? GetRefreshTokenFromCookie(HttpContext context) =>
        context.Request.Cookies[CookieName];
}
