# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People at home in the evening who want to watch something and cannot decide. Solo or couple, phone or laptop, tired, 5 to 10 minutes of patience before they give up and doomscroll. Secondary: the same person later in the week, returning to finish a series or to grab something saved.

## Product Purpose

Pick Flick ends the "what should we watch" loop. It learns a taste profile (content types, genres, languages, minimum rating), takes an optional mood (genre shortcuts; AI mood analysis reads recent history when a Bytez key is set, there is no free-text prompt in the backend), factors time of day, and returns ONE pick at a time with a reason. The user can play it immediately in the app (embedded third-party sources), open it on an external free-streaming site, save it, or skip it. Likes and dislikes retrain the weights.

Success: the user presses play within a minute of opening the app, and comes back because the picks got better.

## Positioning

Not a catalog. Netflix, TMDB clones, and free-streaming sites all hand the user a wall of posters. Pick Flick hands them one title. The mechanism a neighbor cannot copy without rebuilding it: taste profile + learned per-genre/language/type weights + mood analysis + time-of-day context + content-type diversity enforcement + a 13-step fallback so a pick always lands, with language treated as inviolable.

Decision recorded 2026-10-09 at the owner's request: the product identity is the recommender ("the friend who picks tonight's movie and presses play"). In-app streaming is the payoff of a pick, not the headline. The owner noted the project had drifted between "recommendation engine" and "streaming app"; this record settles it as recommender-first. Open to revision by the owner.

## Operating Context

- Evening, dim room, often on a phone. Fast decision, then long passive watch.
- Content metadata, posters, backdrops, trailers, and watch providers come from TMDB.
- In-app playback uses iframe embed providers (VidSrc, EmbedSu, 2Embed, AutoEmbed). These are unreliable and can break or be blocked without notice; the UI must treat "source failed, try another" as a normal state.
- External deep links to MovieBox, Cineb, SyncPlay, HiAnime, each toggled by env flag.
- Google sign-in only. Anonymous users can use search and the watch page.
- Onboarding (content types → genres → languages) gates the dashboard.

## Capabilities and Constraints

- Routes: `/` landing, `/login`, `/onboarding`, `/dashboard`, `/search`, `/watchlist`, `/history`, `/watch`, `/api-docs`.
- Core loop: mood/prompt (optional) → one recommendation with "why this pick" → play / save / like / dislike / blacklist / skip.
- Smart mode (full profile) and Filtered mode (manual type, genre, language, rating).
- Continue Watching from per-user viewing progress.
- Trending (global and regional) and universal search as escape hatches.
- Watchlist and history with filters; history exports JSON/CSV.
- Stats (watched, liked, disliked, streak, like ratio) exist in the API. Whether they stay in the UI is undecided; the owner leans toward demoting them.
- AI mood analysis is optional (Bytez key); the UI must work without it.
- Stack is fixed: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui primitives, MongoDB. No test suite.
- Terminology: "pick" (a recommendation), "content type" (movie / series / anime), "taste profile", "mood".

## Brand Commitments

- Name: Pick Flick. No logo or wordmark exists; the current Sparkles icon is a placeholder, not a commitment.
- No committed colors, type, or voice. The existing violet/glass look is explicitly rejected by the owner.

## Evidence on Hand

- Real TMDB imagery (posters, backdrops, trailers) available at runtime for any title.
- No testimonials, user counts, press, or metrics. Existing landing copy ("Join thousands of viewers", "Free forever") is unsubstantiated and must not be carried forward as fact.

## Product Principles

1. One pick, not a wall. Every screen either produces a pick or supports acting on one.
2. Play is one tap away from any title. Fallback sources are a normal state, not an error.
3. The app learns silently. Feedback controls are light; no scoreboards or streak pressure.
4. Mood is the front door. Context (time of day) is applied, not announced.
5. Work for a tired person on a phone in the dark.
