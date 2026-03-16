---
title: Presentation layer
description: ASP.NET Core minimal API endpoints, OpenAPI/Scalar, frontend integration, and error handling.
sidebar:
  order: 5
---

The Presentation layer is the entry point to the system. It maps HTTP requests to Application commands and queries and returns HTTP responses. It's the only layer that knows about HTTP.

## Endpoint groups

Endpoints are organised into groups via the `IEndpointGroup` interface. Each class implements `IEndpointGroup` and its `Map` method receives a `RouteGroupBuilder` scoped to its route prefix:

```csharp
public class TodoLists : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();

        groupBuilder.MapGet(GetTodoLists);
        groupBuilder.MapPost(CreateTodoList);
        groupBuilder.MapPut(UpdateTodoList, "{id}");
        groupBuilder.MapDelete(DeleteTodoList, "{id}");
    }

    [EndpointSummary("Get all Todo Lists")]
    [EndpointDescription("Retrieves all todo lists along with their items.")]
    public static async Task<Ok<TodosVm>> GetTodoLists(ISender sender)
    {
        var vm = await sender.Send(new GetTodosQuery());
        return TypedResults.Ok(vm);
    }

    [EndpointSummary("Create a new Todo List")]
    [EndpointDescription("Creates a new todo list and returns the ID of the created list.")]
    public static async Task<Created<int>> CreateTodoList(ISender sender, CreateTodoListCommand command)
    {
        var id = await sender.Send(command);
        return TypedResults.Created($"/{nameof(TodoLists)}/{id}", id);
    }
}
```

`MapEndpoints()` discovers all `IEndpointGroup` implementations in the assembly automatically — no manual registration needed. The route prefix defaults to `/api/{ClassName}` but can be overridden. Endpoints call `ISender.Send()` to dispatch commands/queries into the Application layer. They contain no business logic.

## Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddApplicationServices();
builder.AddInfrastructureServices();
builder.AddWebServices();

var app = builder.Build();

// Initialize and seed the database (Development only)
if (app.Environment.IsDevelopment())
{
    await app.InitialiseDatabaseAsync();
}

app.UseExceptionHandler(options => { });

app.MapOpenApi();
app.MapScalarApiReference();

app.MapDefaultEndpoints();
app.MapEndpoints(typeof(Program).Assembly);

// Serve SPA (Angular/React)
app.MapFallbackToFile("index.html");
app.UseFileServer();

app.Run();
```

## OpenAPI and Scalar

OpenAPI documentation is generated automatically from the minimal API endpoint definitions. The Scalar interactive API explorer is available at `/scalar`:

```csharp
// Registered in AddWebServices()
builder.Services.AddOpenApi();

// Mapped in the app pipeline
app.MapOpenApi();
app.MapScalarApiReference();
```

Navigate to `https://localhost:<port>/scalar` to explore and test the API interactively, including authenticated endpoints via Bearer token.

## Error handling

A `ProblemDetailsExceptionHandler` maps well-known application exceptions to RFC 9110-compliant Problem Details responses. It is registered in `AddWebServices()` and activated via `app.UseExceptionHandler(options => { })`:

```csharp
public class ProblemDetailsExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, problemDetails) = exception switch
        {
            ValidationException ve => (StatusCodes.Status400BadRequest,
                (ProblemDetails)new ValidationProblemDetails(ve.Errors)
                {
                    Status = StatusCodes.Status400BadRequest,
                    Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1"
                }),
            NotFoundException ne => (StatusCodes.Status404NotFound, new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "The specified resource was not found.",
                Detail = ne.Message
            }),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized"
            }),
            ForbiddenAccessException => (StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Forbidden"
            }),
            _ => (-1, null)
        };

        if (problemDetails is null) return false;

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}
```

- `ValidationException` → `400 Bad Request` with field-level validation errors
- `NotFoundException` → `404 Not Found`
- `UnauthorizedAccessException` → `401 Unauthorized`
- `ForbiddenAccessException` → `403 Forbidden`
- Unrecognised exceptions fall through to the default middleware

## DI registration

The Presentation layer registers its own services via `AddWebServices()`, called from `Program.cs`:

```csharp
public static void AddWebServices(this IHostApplicationBuilder builder)
{
    builder.Services.AddScoped<IUser, CurrentUser>();
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddExceptionHandler<ProblemDetailsExceptionHandler>();
    builder.Services.AddOpenApi(options =>
    {
        options.AddOperationTransformer<ApiExceptionOperationTransformer>();
        options.AddOperationTransformer<IdentityApiOperationTransformer>();
    });
}
```

`Program.cs` calls all three layer extension methods to compose the full application:

```csharp
builder.AddApplicationServices();
builder.AddInfrastructureServices();
builder.AddWebServices();
```

## Frontend integration

For Angular and React projects, the SPA is served through ASP.NET Core:

- **Development** — the SPA dev server runs separately (via `npm start`) and the backend proxies API calls
- **Production** — the SPA is built to `wwwroot` and served as static files; the fallback route (`MapFallbackToFile`) ensures client-side routing works

The SPA communicates with the API via relative URLs (e.g., `/api/todo-lists`), no CORS configuration needed.

## Dependencies

The Presentation layer depends on **Application**, **Infrastructure**, and **Domain**. It is the only layer that references all three — it is the composition root of the application. All other layers point inward; the Presentation layer is the outermost layer that wires everything together at runtime.
