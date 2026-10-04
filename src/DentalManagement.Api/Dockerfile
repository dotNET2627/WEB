# ── Stage 1: restore & publish ────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /repo

# Copy solution + project files first so restore layer is cached
COPY DentalManagement.sln .
COPY src/DentalManagement.Domain/DentalManagement.Domain.csproj            src/DentalManagement.Domain/
COPY src/DentalManagement.Application/DentalManagement.Application.csproj  src/DentalManagement.Application/
COPY src/DentalManagement.Infrastructure/DentalManagement.Infrastructure.csproj src/DentalManagement.Infrastructure/
COPY src/DentalManagement.Api/DentalManagement.Api.csproj                  src/DentalManagement.Api/

RUN dotnet restore src/DentalManagement.Api/DentalManagement.Api.csproj

# Copy remaining source and publish
COPY src/ src/
RUN dotnet publish src/DentalManagement.Api/DentalManagement.Api.csproj \
    -c Release -o /app --no-restore

# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Non-root user for security (built-in in .NET 8+)
USER app

COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "DentalManagement.Api.dll"]
