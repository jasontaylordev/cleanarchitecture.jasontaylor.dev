---
title: Infrastructure layer
description: EF Core DbContext, entity configuration, database initialization, and external service implementations.
sidebar:
  order: 4
---

The Infrastructure layer implements the interfaces defined in Application. It handles all the details that the business logic doesn't care about: database access, external service calls, file I/O, and identity management.

## ApplicationDbContext

`ApplicationDbContext` implements `IApplicationDbContext` from Application:

```csharp
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<TodoList> TodoLists => Set<TodoList>();

    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
```

The context itself stays minimal. Two EF Core interceptors handle the cross-cutting concerns:

- **`AuditableEntityInterceptor`** — sets `Created`, `CreatedBy`, `LastModified`, and `LastModifiedBy` on every `SaveChangesAsync` call using `IUser` (current user) and `TimeProvider` (current time)
- **`DispatchDomainEventsInterceptor`** — after the save completes, publishes any domain events raised on entities through MediatR

## Entity configuration

Each entity gets its own `IEntityTypeConfiguration<T>`:

```csharp
public class TodoListConfiguration : IEntityTypeConfiguration<TodoList>
{
    public void Configure(EntityTypeBuilder<TodoList> builder)
    {
        builder.Property(t => t.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder
            .OwnsOne(b => b.Colour)
            .Property(c => c.Code)
            .HasMaxLength(7)
            .IsRequired();
    }
}
```

`ApplyConfigurationsFromAssembly` in `OnModelCreating` discovers all configuration classes automatically — no manual registration needed.

## Database initialization

`ApplicationDbContextInitialiser` runs at application startup:

```csharp
public class ApplicationDbContextInitialiser
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ApplicationDbContextInitialiser> _logger;

    public async Task InitialiseAsync()
    {
        try
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.Database.EnsureCreatedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initialising the database.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }
}
```

In `Program.cs`, this runs at startup in the Development environment only:

```csharp
if (app.Environment.IsDevelopment())
{
    await app.InitialiseDatabaseAsync();
}
```


## Identity

ASP.NET Core Identity is configured in Infrastructure via `ApplicationUser`:

```csharp
public class ApplicationUser : IdentityUser
{
    // Add custom profile properties here
}
```

The `IdentityDbContext<ApplicationUser>` base class in `ApplicationDbContext` creates all Identity tables automatically.

## External integrations

Any third-party service — email, file storage, SMS, payment gateways — is implemented in the Infrastructure layer. The Application layer defines the interface; Infrastructure provides the implementation:

```csharp
// Defined in Application
public interface IEmailService
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct);
}

// Implemented in Infrastructure
public class EmailService : IEmailService
{
    public async Task SendAsync(string to, string subject, string body, CancellationToken ct)
    {
        // SMTP, SendGrid, Azure Communication Services, etc.
    }
}
```

This keeps the Application layer free of third-party SDK references and makes services easy to swap or stub in tests.

## Background services

Long-running or scheduled tasks are implemented as `IHostedService` or `BackgroundService` in the Infrastructure layer and registered in `AddInfrastructureServices`. Like external integrations, they depend on Application interfaces rather than infrastructure details directly, keeping them testable.

## DI registration

Infrastructure registers its own services in an extension method:

```csharp
public static void AddInfrastructureServices(this IHostApplicationBuilder builder)
{
    var connectionString = builder.Configuration.GetConnectionString(Services.Database);

    builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
    builder.Services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();

    builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
    {
        options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
        options.UseSqlite(connectionString);
    });

    builder.Services.AddScoped<IApplicationDbContext>(
        provider => provider.GetRequiredService<ApplicationDbContext>());

    builder.Services.AddScoped<ApplicationDbContextInitialiser>();

    // Identity, authentication, etc.
}
```

The Presentation layer calls `builder.AddInfrastructureServices()` in `Program.cs`.

## Dependencies

The Infrastructure layer depends on **Application** and **Domain**. Application and Domain never reference Infrastructure — they only see the interfaces. This means the entire persistence and integration layer can be replaced without touching any business logic.
