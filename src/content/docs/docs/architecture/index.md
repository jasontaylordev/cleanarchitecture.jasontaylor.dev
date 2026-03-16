---
title: Architecture overview
description: The four-layer Clean Architecture model used by this template and the dependency rules that govern it.
sidebar:
  order: 1
---

The template is organised into four concentric layers. The fundamental rule is simple:

> **Dependencies point inward.** Outer layers depend on inner layers. Inner layers never depend on outer layers.

![Clean Architecture layer diagram](./architecture-diagram.svg)

## The four layers

### Domain

Located in `src/Domain`. The innermost layer. Contains enterprise-wide business rules that would exist even if there was no software system.

- **Entities**: objects with identity (e.g., `TodoList`, `TodoItem`)
- **Value Objects**: immutable objects defined by their values (e.g., `Colour`)
- **Domain Events**: things that happened in the domain
- **Enumerations**: strongly typed enumerations

No dependencies on any other layer or third-party framework.

### Application

Located in `src/Application`. Orchestrates the use cases of the system. Depends only on Domain.

- **Commands**: mutating operations (create, update, delete)
- **Queries**: read operations that return data
- **Handlers**: execute commands and queries via MediatR
- **Interfaces**: abstractions for infrastructure concerns (`IApplicationDbContext`)
- **Validators**: FluentValidation rules for commands/queries
- **Pipeline Behaviours**: cross-cutting concerns (validation, logging, performance)

### Infrastructure

Located in `src/Infrastructure`. Implements the interfaces defined in Application. Depends on Application.

- **DbContext**: EF Core implementation of `IApplicationDbContext`
- **Entity Configuration**: `IEntityTypeConfiguration<T>` per entity
- **External Services**: email, storage, third-party API clients

### Presentation

Located in `src/Web`. The entry point to the system. Depends on Application and Infrastructure (for DI registration).

- **Endpoints**: ASP.NET Core minimal API endpoints
- **Middleware**: error handling, authentication
- **OpenAPI / Scalar**: API documentation
- **SPA**: Angular or React frontend (proxied in development)

## Why this structure?

Each layer has a single responsibility and a clear seam:

- **Testable**: Domain and Application layers have no infrastructure dependencies, so business logic can be unit-tested without a database or HTTP server.
- **Replaceable**: Infrastructure details (database provider, email service, file storage) are hidden behind interfaces. Swapping them doesn't touch the core.
- **Discoverable**: Features are organised as vertical slices inside each layer. Finding the code for a use case means opening one folder, not hunting across the solution.
- **Stable under change**: The inner layers (Domain, Application) are insulated from churn in the outer layers. A new UI framework or database provider doesn't ripple inward.
