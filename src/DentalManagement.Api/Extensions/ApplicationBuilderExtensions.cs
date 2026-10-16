using DentalManagement.Application.MedicalImages;
using DentalManagement.Infrastructure.Storage;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

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

        // Phục vụ ảnh y tế đã tải lên tại /files/medical-images/{file} (không cần JWT để <img> tải được).
        app.UseMedicalImageFiles();

        app.UseRateLimiter();

        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }

    private static void UseMedicalImageFiles(this WebApplication app)
    {
        var options = app.Services.GetRequiredService<IOptions<FileStorageOptions>>().Value;
        var rootPath = FileStorageOptions.ResolveRootPath(options.RootPath, app.Environment.ContentRootPath);
        Directory.CreateDirectory(rootPath);

        var contentTypeProvider = new FileExtensionContentTypeProvider();
        contentTypeProvider.Mappings[".dcm"] = "application/dicom";
        contentTypeProvider.Mappings[".dicom"] = "application/dicom";

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(rootPath),
            RequestPath = MedicalImageLimits.PublicPathPrefix,
            ContentTypeProvider = contentTypeProvider
        });
    }
}
