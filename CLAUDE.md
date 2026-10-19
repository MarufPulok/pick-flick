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
1. *Source*, in parallel, each raced against a 3s budget: one discover page per content type in the profile (equal budget), a random language from the profile per call, 1–2 genres sampled with learned weights; plus TMDB `/recommendations` for every seed from `HistoryService.getSeeds` (up to 5: 2 liked, 1 seen, 2 qualified plays, ≤90 days old, never a title later disliked or blacklisted), capped at 8 survivors per seed. Discover counts *unseen, eligible* results; when fewer than 5, it tries pages 4–6, then drops genres, then other profile languages (English first). SERIES with `ja` sets `without_genres=16` so anime stays in the ANIME lane. Some languages have no TV at the vote floor at all (ta/te/ml), which is why the retry exists: a type that sources nothing drops out of the lottery and hands its share to ANIME.
2. *Filter*: `HistoryService.getExcluded` (every history action, plays, watchlist; skips expire after 30 days), served picks, rating floor, profile languages (seed-sourced candidates may be any language), and an age-normalized vote floor: ≥50 *projected* votes (half-life 180d, window 2y, floor 30d), so recent releases aren't excluded; TMDB discover asks for `vote_count.gte=15`. Keys use `seenKey()` (TMDB media namespace, so SERIES/ANIME never collide). Dedup keeps every seed that surfaced a title (`seeds`, primary first).
3. *Choose content type first*: weighted random over types with candidates: learned weight (floored at 0.25 of neutral, so no type is locked out) × diversity decay `0.75·0.5^k + 0.25`, k = occurrences in the last 5 served picks. This is what keeps movies, series and anime at equal share; scoring across types would let TV's higher ratings bury movies.
4. *Score within type*: profile genre match + learned genre weights, language weight, rating shrunk toward 6.5 by vote count. Seed pool wins 40% of nights when it holds at least 5 candidates.
5. *Sample*: softmax (T 0.3) over the top 20 after min-max normalizing, probabilities × the same diversity decay by primary genre (k over the last 10 served picks). Picks served to that user in the last 6 hours are excluded (`servedCache`, in-memory Map with type and genre, newest 100).

Mood chips (`genres` and/or `languages` on a SMART request) replace profile genres/languages and skip seeds. The chip row itself comes from `GET /api/mood-chips?hour=&day=` (`src/lib/mood-chips.ts`): three base moods, one chip for the hour, up to two learned chips ("More Thriller", "Korean night") from weights of 60 or more (three positive signals), rotating daily through the top three, then Surprise me. There is no free-text mood input.

`loadSmartContext` (`src/services/smart-context.service.ts`) loads profile, exclusions, weights and seeds once (`Promise.allSettled`, safe defaults, never 500s on one failed query) and derives `recentTypes`/`recentGenres` from served picks; both the hero route and `GET /api/feed` use it. The feed (`generateSmartFeed`) returns 12 picks, lanes per content type interleaved, seeds capped at 40% per lane and taken round-robin by seed, greedy within a lane by normalized score × diversity decay (same genre or seed already placed); rendered by `ForYouSection` on the dashboard, which hides the current hero. Both routes record impressions (`ImpressionService`) and diversity stats (`src/lib/diversity-stats.ts`, aggregated at `/api/cache-stats` under `diversity`). SMART never dead-ends on a missing taste profile: the route falls back to whatever onboarding saved, then MOVIE+SERIES / English / rating ≥ 6.5, returning `profileComplete: false`. The route also fetches TMDB details for `runtime`, cached in `detailsCache`. The pick screen prefetches the next pick so "Not tonight" is instant. A prefetch request carries `prefetch: true` and is marked served but is not an impression; when the client shows it, the next prefetch reports it as `shown` and the impression is recorded then. FILTERED (Refine) picks never touch the served map.

### Preference Learning (`src/services/preference-weights.service.ts`)

Every signal updates `PreferenceWeightsModel` (per-user genre/language/contentType weights, 0–100, default 50): like +5, seen +4, first play +1, dislike −3, never again −8, not tonight −1. Weights decay toward 50 with a 100-day half-life (lazy, via `decayedAt`). A play from any screen (pick, search, trending, `/watch`) hits `/api/continue-watching` on player open: +1 only the first time that title is opened. When a progress ping passes 10 min or 20% of runtime, `ViewingProgress.learned` flips once (atomic) and the play earns +4 and becomes seed-eligible. Only VidLink reports progress, so plays on other providers stop at +1.

`getWeights` blends the decayed weights with empirical rates from the `impressions` collection (hero 1, feed 0.25, 120-day TTL): hit rate per key with a Beta prior at the user's global rate × 10 pseudo-impressions, mapped to `50 × rate / globalRate`, blended by evidence (α ≤ 0.5; keys under 5 impressions unchanged). Rates are cached 5 min per user. Learned mood chips read the decayed weights without the blend (`{ empirical: false }`). "Seen it" on the pick opens a modal: Loved it → LIKED, Not for me → DISLIKED, otherwise WATCHED.

### Caching (`src/lib/cache.ts`)

In-memory `TTLCache` instances (not Redis). Global singletons: `discoverCache`, `detailsCache`, `videosCache`, `providersCache`, `similarCache`, `searchCache`, `trendingCache`, `recommendationsCache`, `servedCache`. Cache performance is exposed at `/api/cache-stats`. Cache resets on server restart.

### Auth (`src/lib/auth.ts`)

NextAuth v5 beta with Google OAuth + `MongoDBAdapter`. Sessions stored in DB (30-day expiry). After OAuth callback, redirects to `/onboarding` if `TasteProfile` is missing or `complete: false`.

There is **no middleware**. Protection is per-route: user-scoped API routes (`history`, `profile`, `recommendation`, `stats`, `watchlist`) call `await auth()` and 401 on no session; `search`, `trending`, `similar`, `mood-analyze` are public. Pages gate client-side with `useSession()`. `/search` and `/watch` work for anonymous users. `/admin/*` is gated server-side in `src/app/admin/layout.tsx` via `getAdminSession()` (`src/lib/admin.ts`, emails hardcoded in `src/config/admin.config.ts`); non-admins get a 404. `/api/cache-stats` uses the same check. `POST /api/events` is public (anonymous beacons).

### MongoDB Models (`src/infrastructure/db/models/`)

- `UserModel` — NextAuth user record
- `TasteProfileModel` — onboarding preferences (contentTypes, genres, languages, minRating)
- `PreferenceWeightsModel` — learned weights from feedback
- `RecommendationHistoryModel` — every action on a pick (WATCHED/SKIPPED/LIKED/DISLIKED/BLACKLISTED); feeds exclusions and seeds
- `ImpressionModel` — every SMART pick shown (hero or feed); denominator for empirical rates, 120-day TTL
- `WatchlistModel` — saved content
- `BlacklistModel` — explicitly excluded content
- `ViewingProgressModel` — per-user viewing records; backs "Continue Watching" (`/api/continue-watching`), exclusions and seeds; `learned` marks a qualified play
- `EventModel` — usage beacons (`view`, `player` source outcome, `chip` tap) keyed by a random browser `anonId` (localStorage `pf_anon_id`), optional userId, device class; no IP or raw UA; 120-day TTL. Sent by `track()` (`src/lib/track.ts`) from `PageViewTracker` (root layout), `StreamPlayer` and the mood chips

### Streaming

Two separate mechanisms, both client-side only:

- **In-app embed player** — `src/lib/embed-providers.ts` lists 12 iframe providers with per-provider URL builders keyed by TMDB id, content type, optional season/episode, and `startAt` seconds. On open, `rankProviders()` probes every provider from the browser (`no-cors` fetch, 4s timeout, cached 5 min), sorts by latency with a 300ms bonus for providers that report progress, and the player starts on the fastest. VidLink is the only one that emits `PLAYER_EVENT` postMessages; `StreamPlayer` listens and posts throttled progress (position, duration, season, episode) to `/api/continue-watching`, which the continue-watching cards use to resume via `?watch=&type=&s=&e=&t=`. `StreamPlayer` (`src/components/dashboard/stream-player.tsx`) lets the user switch provider at runtime. `/watch?id=&type=` renders it standalone. `src/lib/rivestream.ts` is the superseded predecessor and has no importers.
- **External deep links** — `src/lib/free-streaming.ts` + `src/config/free-streaming.config.ts` build outbound URLs (MovieBox, Cineb, SyncPlay, HiAnime). Each platform toggled via `NEXT_PUBLIC_ENABLE_*`; base URLs via `NEXT_PUBLIC_*_BASE_URL`.

### Client-side state (`src/lib/`)

Browser-only, not persisted to MongoDB: `storage.ts` (localStorage wrapper with in-memory fallback), `watching-state.ts` (currently-watching tracker + open-stream flag, drives `currently-watching-banner`). Treat these as ephemeral.

### Images

`src/components/ui/poster.tsx` is the one poster tile: 2:3, 10% bone skeleton as the surface, next/image fades in over it on decode (`.poster-img` / `.is-loaded`, off under reduced motion). Rails use it with `sizes="130px"`; the hero uses it with `priority`. Rail lists carry `.rail` for scroll snapping. The hero backdrop is served at TMDB `w1280`, never `original`. Every `?watch=` link passes `&poster=` so Continue Watching has art; when a link has none, the continue-watching POST backfills it from TMDB details.

### Visual system

Design tokens live in `src/app/globals.css` and are documented in `DESIGN.md` (dark-only "Projection Booth" world; amber is reserved for pressable things). Product truth is in `PRODUCT.md`. The dashboard is one surface, `src/components/dashboard/pick-screen.tsx`: mood input, chips, one pick lit by its own backdrop, Play. Mood chips and free-text keywords map to TMDB genre ids in `src/lib/mood-chips.ts`.

### Admin dashboard (`/admin`)

Server components call `src/services/admin/*.service.ts` directly (no API layer); shapes live in `src/services/admin/types.ts`. Screens: Overview (pick to play, median time to play, active on 2+ days, DAU, funnel, weekday×hour heatmap in Asia/Dhaka, live feed), Users (list + per-user dossier: said vs did, timeline, progress, watchlist), Taste, Picks, Traffic (events), System (in-memory caches and diversity). Pick to play joins impressions to a `ViewingProgress` first-open within 6h. `Impression.seeded` tags seed-pool picks (absent on older rows). Charts are inline SVG/CSS in `src/components/admin/`, no chart library. Mockups: `docs/mockups/admin-dashboard.excalidraw`.

### API Docs

Swagger UI at `/api-docs`. Spec generated via `next-swagger-doc` from JSDoc `@swagger` annotations in route files.

## Key Conventions

- All environment variables accessed through `src/config/env.config.ts` (`serverEnv` for server-only, `clientEnv` for public).
- API routes validate input with Zod schemas from `src/dtos/` before calling services.
- TMDB genre IDs are stored as strings in MongoDB.
- `src/domain/` directory exists but is currently empty — reserved for future domain layer.
