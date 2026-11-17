---
title: Installation
description: How to install the Clean Architecture Solution Template using the .NET CLI.
sidebar:
  order: 2
---

## Prerequisites

Before installing the template, make sure you have the following installed:

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) or later ([.NET 11.0 SDK](https://dotnet.microsoft.com/download/dotnet/11.0) or later to create .NET 11 solutions)
- [Node.js LTS](https://nodejs.org/en/download) — only required if you plan to use the Angular or React frontend
- [Docker Desktop](https://www.docker.com/products/docker-desktop) or [Podman](https://podman.io/) (or any OCI-compliant container runtime) — only required when using SQL Server or PostgreSQL. Not required when using SQLite (the default).

Generated solutions also include a [Dev Container](/docs/features/dev-container/), so once a solution is created you can develop in a container with all of these preinstalled.

You can verify your installed versions:

```bash
dotnet --version  # Verify .NET
node --version    # Verify Node.js
```

## Install the template

Install the template from NuGet using the .NET CLI:

```bash
dotnet new install Clean.Architecture.Solution.Template
```

The template is installed globally and is available for all future projects. You only need to run this once.

## Update the template

To update all installed templates to their latest versions:

```bash
dotnet new update
```

To update only this template:

```bash
dotnet new update Clean.Architecture.Solution.Template
```

## Uninstall

If you need to remove the template:

```bash
dotnet new uninstall Clean.Architecture.Solution.Template
```

## Next steps

Now that the template is installed, [create your first project](/docs/getting-started/first-project/).
