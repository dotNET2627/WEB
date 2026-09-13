namespace DentalManagement.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        app.UseExceptionHandler(exceptionApp => exceptionApp.Run(async context =>
        {
            await Results.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "An unexpected server error occurred.").ExecuteAsync(context);
        }));

        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }

        app.UseCors("Frontend");

        // Enable after configuring authentication/authorization packages.
        // app.UseAuthentication();
        // app.UseAuthorization();

        return app;
    }
}
