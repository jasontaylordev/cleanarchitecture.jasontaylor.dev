---
title: Behaviours, not boilerplate
description: Five pipeline behaviours run automatically for every request — logging, exception handling, authorisation, validation, and performance monitoring. Nothing to wire up.
sidebar:
  order: 4
---

Every request in the template passes through a pipeline of five behaviours before reaching its handler. They run in order, automatically, for every command and query — you never wire them up manually.

```
LoggingBehaviour
  → UnhandledExceptionBehaviour
    → AuthorizationBehaviour
      → ValidationBehaviour
        → PerformanceBehaviour
          → Your Handler
```

## LoggingBehaviour

Runs before the handler via `IRequestPreProcessor`. Logs the request name, the current user's ID, and username for every request — giving you a complete audit trail out of the box.

## UnhandledExceptionBehaviour

Wraps the rest of the pipeline in a try/catch. If an unexpected exception escapes a handler, it is logged with the request name and re-thrown. Combined with the global `ProblemDetailsExceptionHandler` in the Presentation layer, all unhandled exceptions produce consistent [RFC 9110](https://tools.ietf.org/html/rfc9110#section-15.5.1) Problem Details responses.

## AuthorizationBehaviour

Enforces application-layer authorization for any request decorated with the `[Authorize]` attribute:

```csharp
[Authorize(Roles = "Administrator")]
public record PurgeTodoListsCommand : IRequest;
```

The behaviour checks authentication status, role membership, and policy evaluation — all before the handler is reached. Throws `ForbiddenAccessException` (mapped to `403`) if the check fails, or `UnauthorizedAccessException` (mapped to `401`) if the user is not authenticated.

## ValidationBehaviour

The template uses [FluentValidation](https://docs.fluentvalidation.net/) for request validation. Validators run automatically in the MediatR pipeline before any handler executes — you never call validators manually.

## Writing a validator

Create an `AbstractValidator<T>` for any command or query:

```csharp
public class CreateTodoListCommandValidator : AbstractValidator<CreateTodoListCommand>
{
    private readonly IApplicationDbContext _context;

    public CreateTodoListCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(v => v.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(v => v.Title)
            .MustAsync(BeUniqueTitle)
            .WithMessage("'{PropertyName}' must be unique.")
            .WithErrorCode("Unique");
    }

    private async Task<bool> BeUniqueTitle(string? title, CancellationToken ct)
        => await _context.TodoLists.AllAsync(l => l.Title != title, ct);
}
```

FluentValidation validators are auto-discovered from the Application assembly — no manual registration needed. Any class that inherits `AbstractValidator<T>` is automatically available.

## How ValidationBehaviour works

`ValidationBehaviour<TRequest, TResponse>` runs for every request that has at least one registered validator:

```csharp
public class ValidationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);

            var validationResults = await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, ct)));

            var failures = validationResults
                .SelectMany(r => r.Errors)
                .Where(f => f != null)
                .ToList();

            if (failures.Count != 0)
                throw new ValidationException(failures);
        }

        return await next();
    }
}
```

All validators for a request run in parallel. If any fail, a `ValidationException` is thrown **before the handler runs**.

## Error response format

The global exception handler in the Presentation layer maps `ValidationException` to a `400 Bad Request` Problem Details response:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation failures have occurred.",
  "status": 400,
  "errors": {
    "Title": [
      "'Title' must not be empty.",
      "'Title' must be unique."
    ]
  }
}
```

The Angular and React frontends handle this format natively in their error interceptors.

## Validators without async rules

For simple synchronous validation, just omit the `IApplicationDbContext` dependency:

```csharp
public class UpdateTodoItemCommandValidator : AbstractValidator<UpdateTodoItemCommand>
{
    public UpdateTodoItemCommandValidator()
    {
        RuleFor(v => v.Title)
            .MaximumLength(200)
            .NotEmpty();

        RuleFor(v => v.Note)
            .MaximumLength(1000);
    }
}
```

## No validator needed?

If a command or query has no validator, `ValidationBehaviour` simply calls `next()` — it's a no-op. You don't need to create an empty validator.

## PerformanceBehaviour

Times every request. If execution exceeds 500ms, a warning is logged with the request name, elapsed time, and current user — making slow handlers easy to identify without any additional instrumentation.

```
warn: PerformanceBehaviour
      Long running request: CreateTodoListCommand (532 milliseconds)
      UserId: abc123 | UserName: jason@example.com
```

The 500ms threshold can be adjusted in `PerformanceBehaviour.cs`.
