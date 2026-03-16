---
title: Automated tests (zero setup)
description: The template includes four layers of tests — unit, integration, functional, and acceptance — all ready to run with no configuration.
sidebar:
  order: 5
---

The template includes a comprehensive test suite covering four distinct layers. All test projects are pre-configured and ready to run from day one — no configuration or manual setup required.

```bash
dotnet test
```

## Test projects

| Project | Type | Tests |
|---------|------|-------|
| `Domain.UnitTests` | Unit | Domain value objects and pure logic |
| `Application.UnitTests` | Unit | Pipeline behaviours, validators, mappings |
| `Application.FunctionalTests` | Functional | Command/query handlers against a real database |
| `Web.AcceptanceTests` | Acceptance | Full stack via browser automation |

## Unit tests

**`Domain.UnitTests`** tests pure domain logic — value objects, entity behaviour, and business rules with no dependencies.

**`Application.UnitTests`** tests the application layer in isolation using [Moq](https://github.com/devlooped/moq) for mocking and [Shouldly](https://github.com/shouldly/shouldly) for assertions:

```csharp
[Test]
public async Task ShouldRequireMinimumFields()
{
    var command = new CreateTodoListCommand();
    await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(command));
}
```

## Functional tests

`Application.FunctionalTests` runs commands and queries against a real database — testing the full application stack below the HTTP layer.

The test project uses Aspire's [`DistributedApplicationTestingBuilder`](https://aspire.dev/testing/overview/) to start a TestAppHost, which spins up the same database resources configured in the AppHost (SQLite, PostgreSQL, or SQL Server). No separate setup or Testcontainers configuration required — whatever database was chosen at creation time is used automatically.

**[Respawn](https://github.com/jbogard/Respawn)** resets the database to a clean state between each test, ensuring full isolation without recreating the schema:

```csharp
// Before each test — database is reset automatically
await _respawner.ResetAsync(_connection);
```

## Acceptance tests

`Web.AcceptanceTests` tests the full application stack end-to-end using:

- **[Aspire's `DistributedApplicationTestingBuilder`](https://learn.microsoft.com/en-us/dotnet/aspire/testing/overview)**: starts the entire stack (API, database, frontend) programmatically
- **[Playwright](https://playwright.dev/dotnet/)**: drives a real browser against the running application
- **[Reqnroll](https://reqnroll.net/)**: BDD-style feature files (SpecFlow-compatible)

Example feature file:

```gherkin
Feature: Login

Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter valid credentials
    Then I should be redirected to the home page
```

Acceptance tests are included in Angular and React solutions only (not API-only). They run automatically with `dotnet test` — Aspire starts and tears down the full stack for the test run.

All test layers run in CI from day one.
