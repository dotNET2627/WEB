namespace DentalManagement.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        app.UseExceptionHandler(exceptionApp => exceptionApp.Run(async context =>
        {
            var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("GlobalExceptionHandler");
            var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
            if (exception != null)
            {
                logger.LogError(exception, "Uncaught exception occurred: {ExceptionType} - {Message}", exception.GetType().Name, exception.Message);
            }
            else
            {
                logger.LogError("An unhandled exception occurred at {Path}", context.Request.Path);
            }

            await Results.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "An unexpected server error occurred.").ExecuteAsync(context);
        }));

        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }

        app.UseCors("Frontend");
        app.UseForwardedHeaders();

        app.UseRateLimiter();

        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }
}
