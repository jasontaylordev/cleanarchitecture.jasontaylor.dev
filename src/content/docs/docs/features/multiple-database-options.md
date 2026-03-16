---
title: Multiple database options
description: Choose SQLite, PostgreSQL, or SQL Server when creating your solution. Switch databases without changing application code.
sidebar:
  order: 2
---

The template supports three database types. Choose the one that fits your project at creation time:

```bash
# SQLite (default)
dotnet new ca-sln --database sqlite

# SQL Server
dotnet new ca-sln --database sqlserver

# PostgreSQL
dotnet new ca-sln --database postgresql
```

Each option is backed by an Aspire hosting integration, which manages container lifecycle and injects connection strings automatically — no manual configuration needed.

## SQLite

SQLite uses the [Aspire SQLite hosting integration](https://aspire.dev/integrations/databases/sqlite/sqlite-host/) (`CommunityToolkit.Aspire.Hosting.SQLite`). Aspire creates the database file automatically. No container or server required — ideal for getting started quickly.

## SQL Server

SQL Server uses the [Aspire SQL Server hosting integration](https://aspire.dev/integrations/databases/sql-server/sql-server-host/) (`Aspire.Hosting.SqlServer`). Aspire pulls the SQL Server container image, generates credentials, and injects the connection string into the Web project automatically.

## PostgreSQL

PostgreSQL uses the [Aspire PostgreSQL hosting integration](https://aspire.dev/integrations/databases/postgres/postgres-get-started/) (`Aspire.Hosting.PostgreSQL`). Aspire pulls the PostgreSQL container image, manages its lifecycle, and injects the connection string into the Web project automatically.

## Database initialisation

See [Infrastructure layer](/docs/architecture/infrastructure-layer/) for details on how the database is initialised, seeded, and how to leverage EF Core migrations for production.

## Switching after creation

Changing the database after project creation is not supported by the template. If you need to switch, the cleanest approach is to generate a new solution with the desired database and migrate your domain/application/infrastructure code into it.

## Custom database

You can use any other database manually:

1. Add an [Aspire hosting integration](https://aspire.dev/integrations/databases/) for your database to the AppHost project
2. Install the corresponding EF Core provider NuGet package in `src/Infrastructure`
3. Replace the EF Core provider in `src/Infrastructure/DependencyInjection.cs` with the one for your database
