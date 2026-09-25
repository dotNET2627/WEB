using DentalManagement.Api.Extensions;
using DentalManagement.Application.DependencyInjection;
using DentalManagement.Infrastructure.DependencyInjection;
using dotenv.net;

DotEnv.Load(options: new DotEnvOptions(probeForEnv: true, probeLevelsToSearch: 5));
var builder = WebApplication.CreateBuilder(args);

// Keep local development logging portable; Windows Event Log can require elevated permissions.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddApiServices(builder.Configuration, builder.Environment);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseApiPipeline();
app.MapApiEndpoints();

app.Run();

public partial class Program;
