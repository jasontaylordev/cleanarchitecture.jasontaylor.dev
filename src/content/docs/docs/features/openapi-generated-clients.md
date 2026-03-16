---
title: OpenAPI & generated clients
description: The template generates OpenAPI documentation via Scalar and auto-generates TypeScript clients for Angular and React — keeping frontend and backend in sync automatically.
sidebar:
  order: 6
---

The template generates an OpenAPI document from your Minimal API endpoints and serves it through [Scalar](https://scalar.com/). For Angular and React projects, a TypeScript client is automatically generated from that document — so your frontend always has type-safe, up-to-date API calls with no manual effort.

## Scalar UI

Navigate to `/scalar` while the app is running to explore the API:

```
https://localhost:<port>/scalar
```

Scalar provides:

- **Interactive request builder**: fill in parameters and send requests directly from the browser
- **Authentication support**: obtain a Bearer token and Scalar attaches it to subsequent requests automatically
- **Schema explorer**: browse all request and response schemas
- **Code generation**: copy example requests in cURL, C#, Python, and more

## OpenAPI configuration

OpenAPI is configured in the Presentation layer:

```csharp
builder.Services.AddOpenApi(options =>
{
    options.AddOperationTransformer<ApiExceptionOperationTransformer>();
    options.AddOperationTransformer<IdentityApiOperationTransformer>();
    // API-only variant: Bearer token security scheme
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});
```

- `ApiExceptionOperationTransformer`: documents the problem details response types returned by the exception handling middleware
- `IdentityApiOperationTransformer`: enriches the built-in Identity API endpoints with OpenAPI metadata
- `BearerSecuritySchemeTransformer`: adds the Bearer token security scheme, enabling the Authorize button in Scalar; included in API-only solutions where Bearer authentication is used

## Registering endpoints in OpenAPI

The template extends ASP.NET Core Minimal API with a lightweight conventions-based approach. Implement `IEndpointGroup` to define a group of related endpoints:

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
    public static async Task<Ok<TodosVm>> GetTodoLists(ISender sender) { ... }

    [EndpointSummary("Create a new Todo List")]
    [EndpointDescription("Creates a new todo list and returns the ID of the created list.")]
    public static async Task<Created<int>> CreateTodoList(ISender sender, CreateTodoListCommand command) { ... }
}
```

The conventions applied automatically:

- **Route prefix**: defaults to `/api/{ClassName}` — `TodoLists` maps to `/api/TodoLists`. Override `RoutePrefix` for custom or nested paths (e.g. `/api/TodoLists/{todoListId}/TodoItems`)
- **OpenAPI tag**: the class name is used as the tag, grouping all endpoints together in Scalar
- **Operation ID**: derived from the handler method name, used as the `operationId` in the OpenAPI document and as the method name in generated TypeScript clients
- **Summary and description**: set via `[EndpointSummary]` and `[EndpointDescription]` attributes on the handler method

`MapEndpoints()` discovers all `IEndpointGroup` implementations in the assembly automatically — no manual registration required.

## Auto-generated TypeScript clients

Both the Angular and React projects include an `nswag.json` configuration. [NSwag](https://github.com/RicoSuter/NSwag) reads the OpenAPI document and generates a strongly-typed TypeScript client automatically.

Client generation runs automatically as a `pre` hook before `start` and `build` in both projects — no manual step required:

```json
"prestart": "npm run generate-api",
"prebuild": "npm run generate-api",
"generate-api": "nswag run /runtime:Net100"
```

To regenerate manually after an API change without starting the dev server:

```bash
cd src/Web/ClientApp
npm run generate-api
```

This solves several common frontend-backend integration problems:

| Problem | Solution |
|---------|----------|
| Requires knowledge of API | Developers explore the API through Scalar or the generated TypeScript client |
| Hard-coded URLs | The client manages all URLs; the base URL is injected via configuration |
| Duplicated types | Types are defined in the backend and generated in the frontend — one source of truth |
| Breaking changes hard to detect | Regenerating the client after an API change causes TypeScript compilation errors for any affected code |
