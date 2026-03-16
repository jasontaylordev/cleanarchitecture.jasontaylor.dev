---
title: Domain layer
description: Entities, value objects, domain events, and the rules that govern the innermost layer.
sidebar:
  order: 2
---

The Domain layer is the heart of the application. It contains enterprise business rules that are independent of any application, UI, or infrastructure concern. It has no dependencies on other layers, which means the domain model can evolve independently of how data is stored, how the API is exposed, or which frameworks are in use.

## Entities

Entities are objects with a persistent identity. They encapsulate business rules and maintain their own invariants.

```csharp
public class TodoList : BaseAuditableEntity
{
    public string? Title { get; set; }
    public Colour Colour { get; set; } = Colour.White;
    public IList<TodoItem> Items { get; private set; } = new List<TodoItem>();
}
```

`BaseAuditableEntity` provides `Id`, `Created`, `CreatedBy`, `LastModified`, and `LastModifiedBy` automatically via EF Core interceptors in Infrastructure.

## Value objects

```csharp
public class Colour(string code) : ValueObject
{
    public static Colour From(string code)
    {
        var colour = new Colour(code);
        if (!SupportedColours.Contains(colour))
            throw new UnsupportedColourException(code);
        return colour;
    }

    public static Colour White  => new("#FFFFFF");
    public static Colour Red    => new("#FF5733");
    public static Colour Orange => new("#FFC300");
    public static Colour Yellow => new("#FFFF66");
    public static Colour Green  => new("#CCFF99");
    public static Colour Blue   => new("#6666FF");
    public static Colour Purple => new("#9966CC");
    public static Colour Grey   => new("#999999");

    public string Code { get; private set; } = string.IsNullOrWhiteSpace(code) ? "#000000" : code;

    public static implicit operator string(Colour colour) => colour.ToString();
    public static explicit operator Colour(string code) => From(code);

    public override string ToString() => Code;

    protected static IEnumerable<Colour> SupportedColours
    {
        get
        {
            yield return White;
            yield return Red;
            yield return Orange;
            yield return Yellow;
            yield return Green;
            yield return Blue;
            yield return Purple;
            yield return Grey;
        }
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Code;
    }
}
```

## Domain events

```csharp
// Raised on the entity
public class TodoItem : BaseAuditableEntity
{
    public int ListId { get; set; }
    public string? Title { get; set; }
    public string? Note { get; set; }
    public PriorityLevel Priority { get; set; }
    public DateTime? Reminder { get; set; }

    private bool _done;
    public bool Done
    {
        get => _done;
        set
        {
            if (value && !_done)
                AddDomainEvent(new TodoItemCompletedEvent(this));
            _done = value;
        }
    }

    public TodoList List { get; set; } = null!;
}

// Defined in Domain
public class TodoItemCreatedEvent : BaseEvent
{
    public TodoItemCreatedEvent(TodoItem item) { Item = item; }
    public TodoItem Item { get; }
}

public class TodoItemCompletedEvent : BaseEvent
{
    public TodoItemCompletedEvent(TodoItem item) { Item = item; }
    public TodoItem Item { get; }
}

public class TodoItemDeletedEvent : BaseEvent
{
    public TodoItemDeletedEvent(TodoItem item) { Item = item; }
    public TodoItem Item { get; }
}

// Handled in Application
public class LogTodoItemCompleted : INotificationHandler<TodoItemCompletedEvent>
{
    public Task Handle(TodoItemCompletedEvent notification, CancellationToken ct)
    {
        // send notification, update audit log, etc.
        return Task.CompletedTask;
    }
}
```

Domain events are dispatched by `SaveChangesAsync` in the `ApplicationDbContext` — after the entity changes are saved, all raised domain events are published through MediatR.

## Aggregates

An aggregate is a cluster of domain objects treated as a single unit. One entity acts as the **aggregate root** — the only entry point for changes to the cluster.

`TodoList` is an aggregate root. The `Items` collection has a `private set`, so only `TodoList` itself can replace the collection — external code cannot swap it out:

```csharp
public class TodoList : BaseAuditableEntity
{
    public string? Title { get; set; }
    public Colour Colour { get; set; } = Colour.White;
    public IList<TodoItem> Items { get; private set; } = new List<TodoItem>();
}
```

EF Core populates and tracks the `Items` collection; the `private set` prevents external code from replacing it entirely.

## Enumerations

The template uses a standard C# `enum` for priority levels:

```csharp
public enum PriorityLevel
{
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3
}
```

## Dependencies

The Domain layer has **no dependencies** on Application, Infrastructure, or Web. It has one intentional NuGet dependency: `MediatR.Contracts`. This lightweight, implementation-free package provides only the `INotification` interface used by `BaseEvent`, allowing domain events to flow directly into MediatR's pub/sub system in the Application layer with no adapter required.

Removing it is possible — define a local marker interface (e.g. `IDomainEvent`) and wrap it in Application before publishing — but that adds complexity for minimal gain. This tradeoff is documented in [ADR-004](https://github.com/jasontaylordev/CleanArchitecture/wiki/ADR-004-Adopting-MediatR-For-Domain-Events).
