using DentalManagement.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Keep local development logging portable; Windows Event Log can require elevated permissions.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddApiServices(builder.Configuration);

// After adding project references, enable the two composition-root registrations below.
// Add using DentalManagement.Application.DependencyInjection;
// Add using DentalManagement.Infrastructure.DependencyInjection;
// builder.Services.AddApplication();
// builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseApiPipeline();
app.MapApiEndpoints();

app.Run();

public partial class Program;
