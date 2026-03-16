---
title: Structured use cases
description: How the template organises features as vertical slices — each use case is a self-contained folder with a command or query, a validator, and a handler.
sidebar:
  order: 3
---

Every feature in the template is structured as a **vertical slice** — a self-contained folder containing everything needed for one use case: the request, its validator, and its handler. There are no bloated service classes. Adding a new feature means adding a new folder.

Under the hood, requests are dispatched through [MediatR](https://github.com/jbogard/MediatR). Every operation is either a **command** (mutates state, returns a result) or a **query** (reads state, never mutates).

## How it works

All commands and queries go through MediatR's `ISender` pipeline:

```
HTTP Request
    ↓
Endpoint calls ISender.Send(command)
    ↓
Pipeline Behaviours (logging → validation → handler)
    ↓
Handler executes (reads/writes via IApplicationDbContext)
    ↓
Response returned
```

## Commands

A command represents the intent to change something:

```csharp
// The request (record for value equality)
public record CreateTodoListCommand : IRequest<int>
{
    public string? Title { get; init; }
}

// The validator (runs in pipeline before the handler)
public class CreateTodoListCommandValidator : AbstractValidator<CreateTodoListCommand>
{
    public CreateTodoListCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(v => v.Title)
            .MaximumLength(200)
            .NotEmpty();

        RuleFor(v => v.Title)
            .MustAsync(BeUniqueTitle)
            .WithMessage("The specified title already exists.");
    }

    private async Task<bool> BeUniqueTitle(string? title, CancellationToken ct)
        => await _context.TodoLists.AllAsync(l => l.Title != title, ct);
}

// The handler
public class CreateTodoListCommandHandler : IRequestHandler<CreateTodoListCommand, int>
{
    private readonly IApplicationDbContext _context;

    public CreateTodoListCommandHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<int> Handle(CreateTodoListCommand request, CancellationToken ct)
    {
        var entity = new TodoList { Title = request.Title };
        _context.TodoLists.Add(entity);
        await _context.SaveChangesAsync(ct);
        return entity.Id;
    }
}
```

## Queries

A query reads data and returns a DTO:

```csharp
[Authorize]
public record GetTodosQuery : IRequest<TodosVm>;

public class GetTodosQueryHandler : IRequestHandler<GetTodosQuery, TodosVm>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetTodosQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<TodosVm> Handle(GetTodosQuery request, CancellationToken ct)
    {
        return new TodosVm
        {
            PriorityLevels = Enum.GetValues(typeof(PriorityLevel))
                .Cast<PriorityLevel>()
                .Select(p => new LookupDto { Id = (int)p, Title = p.ToString() })
                .ToList(),

            Lists = await _context.TodoLists
                .AsNoTracking()
                .ProjectTo<TodoListDto>(_mapper.ConfigurationProvider)
                .OrderBy(t => t.Title)
                .ToListAsync(ct)
        };
    }
}
```

Note `AsNoTracking()` on queries — no need to track entities for read-only operations.

## Scaffolding with ca-usecase

The `ca-usecase` item template generates the command or query files:

```bash
# Scaffold a command that returns int
dotnet new ca-usecase \
  --name CreateTodoList \
  --feature-name TodoLists \
  --usecase-type command \
  --return-type int

# Scaffold a query that returns TodosVm
dotnet new ca-usecase \
  --name GetTodos \
  --feature-name TodoLists \
  --usecase-type query \
  --return-type TodosVm
```

This creates the command/query record, handler, and (for commands) a validator stub — all wired correctly.

## Pipeline behaviours

Behaviours run in order around every handler:

```
LoggingBehaviour (pre-processor)
  → UnhandledExceptionBehaviour
    → AuthorizationBehaviour
      → ValidationBehaviour
        → PerformanceBehaviour
          → Your Handler
```

| Behaviour | Trigger |
|-----------|---------|
| `LoggingBehaviour` | Always — logs request name, user ID, and username before the handler |
| `UnhandledExceptionBehaviour` | Always — logs and re-throws exceptions |
| `AuthorizationBehaviour` | Requests decorated with `[Authorize]` attribute |
| `ValidationBehaviour` | Requests that have one or more `IValidator<TRequest>` registered |
| `PerformanceBehaviour` | Always — logs warning if handler > 500ms |

## Registering behaviours

Behaviours are registered in Application's DI extension:

```csharp
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
    cfg.AddOpenRequestPreProcessor(typeof(LoggingBehaviour<>));
    cfg.AddOpenBehavior(typeof(UnhandledExceptionBehaviour<,>));
    cfg.AddOpenBehavior(typeof(AuthorizationBehaviour<,>));
    cfg.AddOpenBehavior(typeof(ValidationBehaviour<,>));
    cfg.AddOpenBehavior(typeof(PerformanceBehaviour<,>));
});
```
