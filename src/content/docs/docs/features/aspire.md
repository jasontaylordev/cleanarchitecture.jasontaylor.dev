---
title: Aspire orchestration
description: Aspire orchestrates your entire stack locally with F5 and deploys to the cloud with a single command. OpenTelemetry traces, metrics, and logs are built in.
sidebar:
  order: 7
---

[Aspire](https://learn.microsoft.com/en-us/dotnet/aspire/get-started/aspire-overview) is the orchestration layer for the template. It starts and connects all services locally, provides a live dashboard for observability, and enables one-command cloud deployment.

## Local development

Press **F5** (or run `dotnet run --project src/AppHost`) to start the entire stack:

- The database (SQLite, PostgreSQL, or SQL Server)
- Your .NET API
- The Angular or React frontend (if applicable)

Aspire handles service startup ordering — the API waits for the database, the frontend waits for the API. No manual coordination required.

```bash
dotnet run --project src/AppHost
```

## The Aspire dashboard

Once running, the Aspire dashboard is available at `https://localhost:<port>`. It provides a live view of your entire application:

- **Resources**: status of every service (running, stopped, unhealthy)
- **Traces**: distributed traces across API and database calls
- **Metrics**: request rates, durations, error rates, and runtime metrics
- **Logs**: structured logs from all services in one view
- **Health checks**: `/health` (readiness) and `/alive` (liveness) endpoints

A direct link to the **Scalar API Reference** is shown next to the web service in the resources view.

## AppHost

`AppHost` is the composition root for Aspire orchestration. It declares all resources and their relationships — the database, the API, and the frontend — and Aspire manages startup ordering and connection string injection automatically.

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Database (SQLite by default; PostgreSQL or SQL Server when selected at creation)
var databaseServer = builder.AddSqlite(Services.Database);

// API — waits for the database and exposes a Scalar link in the dashboard
var web = builder.AddProject<Projects.Web>(Services.WebApi)
    .WithReference(databaseServer)
    .WaitFor(databaseServer)
    .WithUrlForEndpoint("http", url =>
    {
        url.DisplayText = "Scalar API Reference";
        url.Url = "/scalar";
    });

// Frontend (Angular or React) — waits for the API
builder.AddJavaScriptApp(Services.WebFrontend, "./../Web/ClientApp")
    .WithRunScript("start")
    .WithReference(web)
    .WaitFor(web)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();
```

Key points:
- **`.WithReference(databaseServer)`** — Aspire injects the connection string into the Web project automatically. No manual configuration needed.
- **`.WaitFor(...)`** — enforces startup ordering. The API won't start until the database is ready; the frontend won't start until the API is ready.
- **`.WithUrlForEndpoint(...)`** — adds the Scalar API Reference link directly in the Aspire dashboard next to the web service.
- The frontend block is omitted for API-only solutions.

## ServiceDefaults

Every service project references `ServiceDefaults`, which provides a single extension method that wires up:

- **OpenTelemetry**: traces (ASP.NET Core + HTTP client), metrics (ASP.NET Core + runtime), and structured logs, all exported via OTLP
- **Health checks**: `/health` and `/alive` endpoints
- **Service discovery**: services reference each other by name, not hard-coded URLs
- **HTTP resilience**: standard retry and circuit-breaker policies via `Microsoft.Extensions.Http.Resilience`

```csharp
// In each service's Program.cs
builder.AddServiceDefaults();
```
