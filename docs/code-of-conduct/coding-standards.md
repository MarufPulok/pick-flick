# Coding Standards

Stack: Next.js 16 App Router, TypeScript, MongoDB/Mongoose, NextAuth v5, React Query, Zod, shadcn/ui, Tailwind v4.

---

## 1. Project Structure

```
src/
  app/             # Pages and API routes (App Router)
    api/           # Route handlers — thin, delegate to services
  components/      # Feature-grouped UI components
    dashboard/
    search/
    onboarding/
    layout/
    ui/            # shadcn/ui primitives only
  config/          # Env access, constants, TMDB URL builders
  dtos/            # Zod schemas for request/response validation
    request/
    response/
  hooks/           # React Query wrappers over internal API routes
  infrastructure/
    db/models/     # Mongoose models
    external/      # TMDB and Bytez HTTP clients
  lib/             # Auth, cache, mood analysis, free-streaming, utilities
  providers/       # React context providers
  services/        # All business logic — called by API routes
```

---

## 2. Layer Rules

**API routes** (`src/app/api/`) — parse request, validate with a Zod DTO, call one service method, return the result. No business logic here.

**Services** (`src/services/`) — own all business logic. One file per domain (e.g. `recommendation.service.ts`). Export plain async functions, not classes.

**Infrastructure** (`src/infrastructure/`) — Mongoose models and external HTTP clients only. Services import from here; API routes do not reach into infrastructure directly.

**Hooks** (`src/hooks/`) — React Query wrappers over the internal API. One hook file per domain concern. No fetch logic outside hooks on the client side.

**Config** (`src/config/`) — all env var access goes through `serverEnv` / `clientEnv` from `env.config.ts`. Never read `process.env` directly anywhere else.

---

## 3. DTOs

Zod schemas live in `src/dtos/request/` and `src/dtos/response/`. Export from `src/dtos/index.ts` and import via `@/dtos`.

- Request DTOs validate inbound API data — use `.parse()` or `.safeParse()` at the top of the route handler.
- Response DTOs describe the shape returned to the client — used for TypeScript types, not runtime validation.
- One `{feature}.req.dto.ts` and one `{feature}.res.dto.ts` per domain. Do not create per-endpoint DTO files.

```ts
// route handler pattern
const body = MyRequestSchema.parse(await req.json());
const result = await myService.doThing(body);
return NextResponse.json(result);
```

---

## 4. Mongoose Models

One file per model in `src/infrastructure/db/models/`. Export the compiled model as the default or named export.

- TMDB genre IDs are stored as strings (not numbers).
- Use `mongoose.models.X || mongoose.model('X', schema)` to avoid re-registration in dev hot-reload.
- No business logic inside models — keep schemas as pure data definitions.

---

## 5. Environment Variables

| Access pattern | Use for |
|---|---|
| `serverEnv.X` | Server-only vars (DB URI, API secrets) |
| `clientEnv.X` | Public vars (`NEXT_PUBLIC_*`) |

Never access `process.env` directly — always go through the typed wrappers in `src/config/env.config.ts`.

---

## 6. Components

- Components live under `src/components/{feature}/`. A component used by exactly one page may live co-located in that page's folder.
- Components over ~200 lines should be split into smaller pieces.
- shadcn/ui primitives live in `src/components/ui/` and are not modified directly — wrap them if customization is needed.
- Forms always use `react-hook-form` + Zod resolver. No untyped form state.
- No direct `fetch` calls inside components — use a hook from `src/hooks/`.

---

## 7. Hooks

Each hook file in `src/hooks/` wraps one React Query `useQuery` or `useMutation`. The hook owns the query key, the fetcher function, and any cache invalidation logic.

```ts
// pattern
export function useWatchlist() {
  return useQuery({ queryKey: ['watchlist'], queryFn: fetchWatchlist });
}
```

---

## 8. Naming

- Files: `kebab-case.ts` / `kebab-case.tsx`
- React components: `PascalCase`
- Functions and variables: `camelCase`
- Zod schemas: `{Feature}RequestSchema`, `{Feature}ResponseSchema`
- Mongoose models: `{Feature}Model`

---

## 9. What NOT to Do

| Temptation | Correct action |
|---|---|
| Business logic in an API route | Move it to a service |
| `process.env` direct access | Use `serverEnv` / `clientEnv` |
| `fetch` inside a component | Use a hook |
| Per-endpoint DTO files | One `{feature}.req.dto.ts` per domain |
| Modifying shadcn/ui files in `ui/` | Wrap the primitive |
| Class-based services | Export plain async functions |

---

## 10. PR Checklist

- [ ] No business logic in route handlers
- [ ] All env vars accessed through `serverEnv` / `clientEnv`
- [ ] New Zod DTOs added to `src/dtos/` and exported from the index
- [ ] New Mongoose models follow the guard pattern (no re-registration)
- [ ] No `fetch` calls in components — hooks only
- [ ] Components >200 lines split
- [ ] Forms use `react-hook-form` + Zod resolver
- [ ] `npm run lint` passes
- [ ] `npm run build` passes (type-check included)
