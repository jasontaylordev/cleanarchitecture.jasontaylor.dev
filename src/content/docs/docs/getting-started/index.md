---
title: Overview
description: What is the Clean Architecture Solution Template, why use it, and who it is for.
sidebar:
  order: 1
---

The Clean Architecture Solution Template is a .NET template for ASP.NET Core that implements Clean Architecture principles. It gives you a **production-ready starting point** so you can focus on building features, not boilerplate.

## What is Clean Architecture?

Clean Architecture separates code into distinct layers with strict dependency rules, keeping business logic independent of frameworks, databases, and UI concerns.

## What the template generates

Running `dotnet new ca-sln` scaffolds a complete multi-project solution:

| Project | Type | Description |
|---------|------|-------------|
| `Domain` | Class Library | Encapsulates core business logic and rules |
| `Application` | Class Library | Defines use cases and orchestrates business operations |
| `Infrastructure` | Class Library | Implements persistence and external service integrations |
| `Web` | ASP.NET Core Web API | Exposes the API and handles authentication |
| `Web/ClientApp` *(optional)* | Angular or React | Frontend project, included when a UI framework is selected |

## Who it's for

The template is designed for .NET developers who:

- Are starting a new enterprise application and want a solid foundation
- Want to apply Clean Architecture without spending days wiring up infrastructure
- Value testability, maintainability, and separation of concerns
- Want to deploy anywhere—Kubernetes, cloud, or on-prem—with minimal configuration

## Next steps

- [Install the template](/docs/getting-started/installation/) and create your first project
- Read the [Architecture Overview](/docs/architecture/) to understand the layer structure
- Browse [Features](/docs/features/multiple-ui-options/) to see what's included out of the box
