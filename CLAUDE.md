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

Two modes.

**FILTERED** (Refine panel): cascading fallback over TMDB discover (13 strategies, relaxing genres then rating). Language is **sacred** and never dropped. Movie genre ids are translated to TV ids for SERIES/ANIME (`MOVIE_TO_TV_GENRE`); anime tags from onboarding (`shonen`, `isekai`, …) resolve to TMDB keyword ids via `tmdbClient.getKeywordId` and run as `with_keywords`. ANIME always forces `original_language=ja` + genre 16.

**SMART** (default, and mood chips/free text): a candidate pipeline, not a cascade.
1. *Source*, in parallel: one discover page per content type in the profile (equal budget), a random language from the profile per call, 1–2 genres sampled with learned weights; plus TMDB `/recommendations` for the last 3 seeds from `HistoryService.getSeeds` (liked, marked seen, or played on any screen).
2. *Filter*: `HistoryService.getExcluded` (every history action, plays, watchlist; skips expire after 30 days), vote/rating floor, profile languages (seed-sourced candidates may be any language). Keys use `seenKey()` (TMDB media namespace, so SERIES/ANIME never collide).
3. *Choose content type first*: weighted random over types with candidates (learned weight × 0.6 if in the last 2 picks). This is what keeps movies, series and anime at equal share; scoring across types would let TV's higher ratings bury movies.
4. *Score within type*: profile genre match + learned genre weights, language weight, rating. Seed pool wins 40% of nights when it holds at least 5 candidates.
5. *Sample*: softmax over the top 20. The route also excludes picks served to that user in the last 6 hours (`servedCache`, in-memory).

Mood genres (`genres` on a SMART request) replace profile genres and skip seeds. SMART never dead-ends on a missing taste profile: the route falls back to whatever onboarding saved, then MOVIE+SERIES / English / rating ≥ 6.5, returning `profileComplete: false`. The route also fetches TMDB details for `runtime`, cached in `detailsCache`. The pick screen prefetches the next pick so "Not tonight" is instant.

### Preference Learning (`src/services/preference-weights.service.ts`)

Every signal updates `PreferenceWeightsModel` (per-user genre/language/contentType weights, 0–100, default 50): like +5, seen +4, dislike −3, never again −5, not tonight −1. A play from any screen (pick, search, trending, `/watch`) hits `/api/continue-watching` on player open, which calls `learnFromPlay` (TMDB details → +4). "Seen it" on the pick opens a modal: Loved it → LIKED, Not for me → DISLIKED, otherwise WATCHED.

### Caching (`src/lib/cache.ts`)

In-memory `TTLCache` instances (not Redis). Global singletons: `discoverCache`, `detailsCache`, `videosCache`, `providersCache`, `similarCache`, `searchCache`, `trendingCache`, `recommendationsCache`, `servedCache`. Cache performance is exposed at `/api/cache-stats`. Cache resets on server restart.

### Auth (`src/lib/auth.ts`)

NextAuth v5 beta with Google OAuth + `MongoDBAdapter`. Sessions stored in DB (30-day expiry). After OAuth callback, redirects to `/onboarding` if `TasteProfile` is missing or `complete: false`.

There is **no middleware**. Protection is per-route: user-scoped API routes (`history`, `profile`, `recommendation`, `stats`, `watchlist`) call `await auth()` and 401 on no session; `search`, `trending`, `similar`, `mood-analyze` are public. Pages gate client-side with `useSession()`. `/search` and `/watch` work for anonymous users.

### MongoDB Models (`src/infrastructure/db/models/`)

- `UserModel` — NextAuth user record
- `TasteProfileModel` — onboarding preferences (contentTypes, genres, languages, minRating)
- `PreferenceWeightsModel` — learned weights from feedback
- `RecommendationHistoryModel` — every action on a pick (WATCHED/SKIPPED/LIKED/DISLIKED/BLACKLISTED); feeds exclusions and seeds
- `WatchlistModel` — saved content
- `BlacklistModel` — explicitly excluded content
- `ViewingProgressModel` — per-user viewing records; backs "Continue Watching" (`/api/continue-watching`), exclusions and seeds

### Streaming

Two separate mechanisms, both client-side only:

- **In-app embed player** — `src/lib/embed-providers.ts` lists 12 iframe providers with per-provider URL builders keyed by TMDB id, content type, optional season/episode, and `startAt` seconds. On open, `rankProviders()` probes every provider from the browser (`no-cors` fetch, 4s timeout, cached 5 min), sorts by latency with a 300ms bonus for providers that report progress, and the player starts on the fastest. VidLink is the only one that emits `PLAYER_EVENT` postMessages; `StreamPlayer` listens and posts throttled progress (position, duration, season, episode) to `/api/continue-watching`, which the continue-watching cards use to resume via `?watch=&type=&s=&e=&t=`. `StreamPlayer` (`src/components/dashboard/stream-player.tsx`) lets the user switch provider at runtime. `/watch?id=&type=` renders it standalone. `src/lib/rivestream.ts` is the superseded predecessor and has no importers.
- **External deep links** — `src/lib/free-streaming.ts` + `src/config/free-streaming.config.ts` build outbound URLs (MovieBox, Cineb, SyncPlay, HiAnime). Each platform toggled via `NEXT_PUBLIC_ENABLE_*`; base URLs via `NEXT_PUBLIC_*_BASE_URL`.

### Client-side state (`src/lib/`)

Browser-only, not persisted to MongoDB: `storage.ts` (localStorage wrapper with in-memory fallback), `watching-state.ts` (currently-watching tracker + open-stream flag, drives `currently-watching-banner`). Treat these as ephemeral.

### Visual system

Design tokens live in `src/app/globals.css` and are documented in `DESIGN.md` (dark-only "Projection Booth" world; amber is reserved for pressable things). Product truth is in `PRODUCT.md`. The dashboard is one surface, `src/components/dashboard/pick-screen.tsx`: mood input, chips, one pick lit by its own backdrop, Play. Mood chips and free-text keywords map to TMDB genre ids in `src/lib/mood-chips.ts`.

### API Docs

Swagger UI at `/api-docs`. Spec generated via `next-swagger-doc` from JSDoc `@swagger` annotations in route files.

## Key Conventions

- All environment variables accessed through `src/config/env.config.ts` (`serverEnv` for server-only, `clientEnv` for public).
- API routes validate input with Zod schemas from `src/dtos/` before calling services.
- TMDB genre IDs are stored as strings in MongoDB.
- `src/domain/` directory exists but is currently empty — reserved for future domain layer.
