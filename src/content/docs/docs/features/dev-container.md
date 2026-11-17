---
title: Dev Container
description: Every generated solution includes a Dev Container with the .NET SDK, the Aspire CLI, Docker and Node.js, ready for VS Code or GitHub Codespaces.
sidebar:
  order: 8
---

Every generated solution includes a [Dev Container](https://containers.dev/) configuration in `.devcontainer/`. Open the solution in a container and everything you need to build, run and test it is already installed, with nothing to set up on your machine apart from a container runtime.

## What's included

- The .NET SDK for the solution's target framework (.NET 10 or .NET 11)
- The [Aspire CLI](https://aspire.dev/get-started/install-cli/) and the Aspire VS Code extension
- Docker-in-Docker, so Aspire can run the SQL Server or PostgreSQL container for local development and the functional tests
- Node.js (LTS), when the solution includes an Angular or React client
- The [Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd), used by the [deployment guide](/docs/getting-started/deployment/)
- The C# Dev Kit, Docker and GitHub Actions VS Code extensions

The configuration is based on Microsoft's [maintained Aspire Dev Container](https://github.com/microsoft/aspire-devcontainer).

## Open the solution in a container

**VS Code:** install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension and a container runtime such as Docker Desktop, open the solution folder, and select **Reopen in Container**.

**GitHub Codespaces:** push the solution to a GitHub repository and create a codespace. Codespaces uses the same configuration automatically.

The first start builds the container image and installs each feature, which can take several minutes. Later starts reuse the image and take seconds. The container is ready when the VS Code status bar shows **Dev Container** with your solution's name.

Once it's running, build and run the solution as usual:

```bash
dotnet build
aspire run
```

## Certificate warning in your browser

When you open the Aspire dashboard or the app from your own browser, you may see a certificate error such as `ERR_CERT_AUTHORITY_INVALID`. This is expected: the HTTPS certificate is the development certificate created inside the container, and your computer doesn't trust it. The certificate is issued to `localhost`, so for local development it's safe to continue past the warning.
