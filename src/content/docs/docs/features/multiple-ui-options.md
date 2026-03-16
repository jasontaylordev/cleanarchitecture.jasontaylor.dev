---
title: Multiple UI options
description: Includes a Web API backend with an optional Angular or React frontend. Authentication is pre-configured for each option.
sidebar:
  order: 1
---

The template supports three application types. Choose the one that fits your project at creation time:

```bash
# Angular 21
dotnet new ca-sln --client-framework Angular

# React 19
dotnet new ca-sln --client-framework React

# API only (no frontend)
dotnet new ca-sln --client-framework None
```

## Angular

The Angular project lives in `src/Web/ClientApp` and is scaffolded with Angular CLI. It includes:

- **Authentication**: login/logout/register UI backed by ASP.NET Core Identity
- **API service**: TypeScript client generated from the OpenAPI spec
- **Routing**: Angular Router with lazy-loaded feature modules
- **HTTP interceptor**: attaches Bearer tokens to API requests, handles 401 responses

**Development:**

The Angular dev server is orchestrated by Aspire's [JavaScript integration](https://aspire.dev/integrations/frameworks/javascript/). Running the AppHost starts both the .NET backend and the Angular CLI dev server together — no separate terminal needed. The Angular app proxies `/api/` requests to the backend automatically.

## React

The React project is a Vite application in `src/Web/ClientApp`. It includes:

- **Authentication**: login/logout/register forms
- **API client**: TypeScript fetch client generated from the OpenAPI spec
- **Routing**: React Router
- **Vite proxy**: `/api/` requests proxied to the .NET backend in dev

**Development:**

The Vite dev server is orchestrated by Aspire's [JavaScript integration](https://aspire.dev/integrations/frameworks/javascript/). Running the AppHost starts both the .NET backend and the Vite dev server together — no separate terminal needed. Vite proxies `/api/` requests to the backend automatically.

## API only

Choosing `--client-framework None` scaffolds a lean solution with no frontend project:

- Smaller solution size
- No Node.js dependency
- Still includes Scalar UI at `/scalar` for exploring the API
- Ideal for microservices, background services, or projects using a separate frontend repo

## Authentication

Authentication is pre-configured for each application type — nothing to wire up.

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">App Type</th>
      <th>Auth Mechanism</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Angular</td>
      <td>Cookie-based authentication via ASP.NET Core Identity (<code>IdentityConstants.ApplicationScheme</code>)</td>
    </tr>
    <tr>
      <td>React</td>
      <td>Cookie-based authentication via ASP.NET Core Identity (<code>IdentityConstants.ApplicationScheme</code>)</td>
    </tr>
    <tr>
      <td>API only</td>
      <td>Bearer token authentication (<code>IdentityConstants.BearerScheme</code>) using opaque tokens</td>
    </tr>
  </tbody>
</table>

The built-in Identity endpoints handle login, registration, token refresh, and email confirmation for all options. Angular and React frontends include pre-built login/logout/register UI backed by these endpoints.

## Switching after creation

Changing the frontend framework after project creation is not supported by the template. If you need to switch, the cleanest approach is to generate a new solution with the desired framework and migrate your domain/application/infrastructure code into it.

## Custom frontend

You can add any other frontend framework manually:

1. Create your frontend project in `src/Web/ClientApp`
2. Configure `Program.cs` to serve static files from `wwwroot`
3. Add the build step to your CI pipeline (build frontend, copy to `wwwroot`, then `dotnet publish`)
4. Call the generated API using the OpenAPI spec at `/openapi/v1.json`
