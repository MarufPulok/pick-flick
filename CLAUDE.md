# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test suite is configured. There is no single-test command.

## Environment Setup

Copy `.env.example` to `.env.local`. Required variables:
- `MONGODB_URI` — MongoDB Atlas connection string
- `TMDB_API_KEY` + `TMDB_ACCESS_TOKEN` — from themoviedb.org
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — for OAuth
- `BETTER_AUTH_SECRET` — random secret for session signing
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
| Lib | `src/lib/` | Auth config, TTL cache, mood analysis, free-streaming URL builders, time-context logic. |
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

### MongoDB Models (`src/infrastructure/db/models/`)

- `UserModel` — NextAuth user record
- `TasteProfileModel` — onboarding preferences (contentTypes, genres, languages, minRating)
- `PreferenceWeightsModel` — learned weights from feedback
- `RecommendationHistoryModel` — past recommendations; used as blacklist
- `WatchlistModel` — saved content
- `BlacklistModel` — explicitly excluded content

### API Docs

Swagger UI at `/api-docs`. Spec generated via `next-swagger-doc` from JSDoc `@swagger` annotations in route files.

### Free Streaming Links

`src/lib/free-streaming.ts` and `src/config/free-streaming.config.ts` build deep-link URLs to external platforms (MovieBox, Cineb, SyncPlay, HiAnime). Each platform can be toggled via `NEXT_PUBLIC_ENABLE_*` env vars. These are client-side only — no server auth required.

## Key Conventions

- All environment variables accessed through `src/config/env.config.ts` (`serverEnv` for server-only, `clientEnv` for public).
- API routes validate input with Zod schemas from `src/dtos/` before calling services.
- TMDB genre IDs are stored as strings in MongoDB.
- `src/domain/` directory exists but is currently empty — reserved for future domain layer.
