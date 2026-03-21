---
title: Deployment
description: Deploy the solution to Azure using the Azure Developer CLI (azd) for quick shared dev environments or sandboxes.
sidebar:
  order: 5
---

This is a short guide on deploying the solution to the cloud using the Azure Developer CLI (azd). This approach is ideal for quickly setting up a shared dev environment or a sandbox to experiment with. For production workloads, consider setting up a CI/CD pipeline and implementing a more robust approach to database initialization.

:::note
The SQLite option is not currently supported for this deployment approach. Use PostgreSQL or SQL Server when deploying to Azure.
:::

## Prerequisites

- [Azure Developer CLI (azd)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)
- [Entity Framework Core tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)

## Create and prepare the solution

Create a new solution:

```bash
dotnet new ca-sln -cf react -db postgresql --output CaReactPostgres
cd CaReactPostgres
```

Update the database initialisation strategy. By default, the template deletes and recreates the database on every startup, which is useful during early development but not suitable for deployment. In `src/Infrastructure/Data/ApplicationDbContextInitialiser.cs`, add the following using directive:

```csharp
using Microsoft.EntityFrameworkCore;
```

Then in the `InitialiseAsync` method, replace the `EnsureDeletedAsync` and `EnsureCreatedAsync` calls with `MigrateAsync`:

```csharp
await _context.Database.MigrateAsync();
```

This ensures existing data is preserved and schema changes are applied incrementally via migrations.

Generate an EF Core migration for the initial database schema:

```bash
dotnet ef migrations add "InitialCreate" --startup-project ./src/Web --project ./src/Infrastructure --output-dir Data/Migrations
```

Build the solution to verify everything compiles:

```bash
dotnet build
```

Run the tests to ensure nothing is broken:

```bash
dotnet test
```

## Deploy to Azure

Initialize your application for deployment. Running `azd init` will scan your project, detect the Aspire AppHost, and prompt you to confirm and provide an environment name:

```bash
azd init
```

Package, provision, and deploy your application in a single step. You will be prompted to select your Azure subscription and region:

```bash
azd up
```

Once deployment is complete, `azd` will output the endpoint URLs for your application. Click the endpoint link to open your application running in Azure.

## Additional commands

Once your application is deployed, you may find the following commands useful:

| Command | Description |
| --- | --- |
| `azd deploy` | Deploy application code to Azure without reprovisioning infrastructure. |
| `azd provision` | Provision Azure resources for your application. Run this any time you update your infrastructure configuration. |
| `azd infra gen` | Generate Infrastructure as Code (IaC) for your project to disk, allowing you to manually manage it. |
| `azd pipeline config` | Configure your deployment pipeline (GitHub Actions or Azure Pipelines) to connect securely to Azure. Use the `--provider` flag to specify a pipeline provider. |
| `azd down` | Delete Azure resources for your application. This will not delete application files on your local machine. |

## See also

- [Explore the Azure Developer CLI initialization workflows](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-init-workflow)
- [Explore the azd up workflow](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-up-workflow)
- [Quickstart: Deploy an Azure Developer CLI template](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/get-started?tabs=localinstall&pivots=programming-language-csharp)
- [EF Core Database Initialisation Strategies](https://www.jasontaylor.dev/ef-core-database-initialisation-strategies/)
