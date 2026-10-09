# Pick Flick

Movie and TV recommendation app. Users complete an onboarding taste profile, then get personalized picks powered by TMDB. Supports mood-based prompts, watchlist, history, and deep-links to free streaming platforms.

**Stack:** Next.js 16 App Router · TypeScript · MongoDB (Mongoose) · NextAuth v5 · React Query · Zod · shadcn/ui · Tailwind v4

## Commands

```bash
npm run dev    # localhost:3000
npm run build
npm run lint
```

No test suite. Copy `.env.example` → `.env.local`.

## Docs

- Architecture & conventions: `docs/code-of-conduct/coding-standards.md`
- Planning guidelines: `docs/code-of-conduct/planning-guidelines.md`

## Environment

Required variables:
- `MONGODB_URI` — MongoDB Atlas connection string
- `TMDB_API_KEY` + `TMDB_ACCESS_TOKEN` — from themoviedb.org
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — for OAuth
- `BETTER_AUTH_SECRET` — random secret for session signing (name is historical; auth is NextAuth, not BetterAuth)
- `BYTEZ_API_KEY` — optional; disables AI mood analysis if absent
- `NEXT_PUBLIC_EMBED_PROVIDER` — optional; default in-app player (`vidsrc` | `embedsu` | `2embed` | `autoembed`)

## Architecture

**Next.js 16 App Router** with TypeScript. All pages live in `src/app/`, API routes in `src/app/api/`.

### Layer Breakdown

| Layer | Path | Purpose |
|-------|------|---------|
| Config | `src/config/` | App constants, env access, genre/language definitions, URL builders. All env vars go through `serverEnv`/`clientEnv` from `env.config.ts`. |
| Infrastructure | `src/infrastructure/db/` | Mongoose models + connection. `src/infrastructure/external/` has the TMDB and Bytez HTTP clients. |
| Services | `src/services/` | All business logic. API routes delegate here. |
| DTOs | `src/dtos/` | Zod schemas for request/response validation. Import from `@/dtos`. |
| Lib | `src/lib/` | Auth config, TTL cache, mood analysis, streaming URL builders, time-context logic, client-side state helpers. |
| Hooks | `src/hooks/` | React Query wrappers over the internal API routes. |
| Components | `src/components/` | Feature-grouped (`dashboard/`, `search/`, `onboarding/`) plus shadcn/ui primitives in `ui/`. |

### Recommendation Engine (`src/services/recommendation.service.ts`)

Core algorithm uses **cascading fallback strategies** (13 defined). Each strategy relaxes constraints progressively (all genres → 2 random genres → 1 genre → no genres → lower rating threshold). Language is treated as **sacred** — it is never dropped across any strategy.

ANIME content type always forces `original_language=ja` and `with_genres=16` (Animation), regardless of the user's language preferences.

`generateSmartRecommendation` orders content types by recency to enforce diversity — types not recently recommended come first.

### Preference Learning (`src/services/preference-weights.service.ts`)

Like/dislike feedback updates `PreferenceWeightsModel` (per-user genre/language/contentType weights, 0–100, default 50). Boosts: +5 for like, -3 for dislike.

### Caching (`src/lib/cache.ts`)

In-memory `TTLCache` instances (not Redis). Global singletons: `discoverCache`, `detailsCache`, `videosCache`, `providersCache`, `similarCache`, `searchCache`, `trendingCache`, `recommendationsCache`. Cache performance is exposed at `/api/cache-stats`. Cache resets on server restart.

### Auth (`src/lib/auth.ts`)

NextAuth v5 beta with Google OAuth + `MongoDBAdapter`. Sessions stored in DB (30-day expiry). After OAuth callback, redirects to `/onboarding` if `TasteProfile` is missing or `complete: false`.

There is **no middleware**. Protection is per-route: user-scoped API routes (`history`, `profile`, `recommendation`, `stats`, `watchlist`) call `await auth()` and 401 on no session; `search`, `trending`, `similar`, `mood-analyze` are public. Pages gate client-side with `useSession()`. `/search` and `/watch` work for anonymous users.

### MongoDB Models (`src/infrastructure/db/models/`)

- `UserModel` — NextAuth user record
- `TasteProfileModel` — onboarding preferences (contentTypes, genres, languages, minRating)
- `PreferenceWeightsModel` — learned weights from feedback
- `RecommendationHistoryModel` — past recommendations; used as blacklist
- `WatchlistModel` — saved content
- `BlacklistModel` — explicitly excluded content
- `ViewingProgressModel` — per-user viewing records; backs "Continue Watching" (`/api/continue-watching`)

### Streaming

Two separate mechanisms, both client-side only:

- **In-app embed player** — `src/lib/embed-providers.ts` lists iframe providers (VidSrc, EmbedSu, 2Embed, AutoEmbed) with per-provider URL builders keyed by TMDB id, content type, and optional season/episode. `StreamPlayer` (`src/components/dashboard/stream-player.tsx`) lets the user switch provider at runtime; `NEXT_PUBLIC_EMBED_PROVIDER` picks the default. `/watch?id=&type=` renders it standalone. `src/lib/rivestream.ts` is the superseded predecessor and has no importers.
- **External deep links** — `src/lib/free-streaming.ts` + `src/config/free-streaming.config.ts` build outbound URLs (MovieBox, Cineb, SyncPlay, HiAnime). Each platform toggled via `NEXT_PUBLIC_ENABLE_*`; base URLs via `NEXT_PUBLIC_*_BASE_URL`.

### Client-side state (`src/lib/`)

Browser-only, not persisted to MongoDB: `storage.ts` (localStorage wrapper with in-memory fallback), `watching-state.ts` (currently-watching tracker + open-stream flag, drives `currently-watching-banner`), `service-status.ts` / `service-usage.ts` / `service-feedback.ts` (per-platform health, usage counts, thumbs). Treat these as ephemeral.

### API Docs

Swagger UI at `/api-docs`. Spec generated via `next-swagger-doc` from JSDoc `@swagger` annotations in route files.

## Key Conventions

- All environment variables accessed through `src/config/env.config.ts` (`serverEnv` for server-only, `clientEnv` for public). Exception: `embed-providers.ts` reads `NEXT_PUBLIC_EMBED_PROVIDER` directly.
- API routes validate input with Zod schemas from `src/dtos/` before calling services.
- TMDB genre IDs are stored as strings in MongoDB.
- `src/domain/` directory exists but is currently empty — reserved for future domain layer.
