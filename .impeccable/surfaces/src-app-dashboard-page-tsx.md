---
version: 1
slug: "src-app-dashboard-page-tsx"
primary_target: "src/app/dashboard/page.tsx"
related_targets: ["src/components/dashboard/pick-screen.tsx"]
---

# Surface brief: /dashboard (The Pick)

Scope: the signed-in home screen, `src/app/dashboard/page.tsx` and the dashboard components it renders. Visitor mode: Operate. The visitor's task is to get one pick and act on it (play, save, skip, rate) in under a minute, on a phone, in a dim room.

Audience and job: a tired evening viewer who cannot decide. Proof and content: the pick's real TMDB title, poster, backdrop, year, runtime, rating, and the engine's "why this pick" line. Constraints: Smart and Filtered modes stay; mood chips map to genre shortcuts; embed sources may fail and the UI treats "try another source" as normal; no new backend.

Memorable moment: the pick's own backdrop lights the whole screen behind a warm scrim; the next pick arrives as a reel change (backdrop first, text follows).

Unresolved: whether stats and the activity feed survive anywhere (leaning: history page only). Light mode is out of scope for this world.

## Direction contract

THESIS: One lit picture in a dark room. The screen is the pick, everything else is the dark around it. It refuses the category default of a dashboard of widgets (stats, feeds, rails) stacked above a generator form.

OWN-WORLD: Warm off-black ground (oklch ~0.17, hue 70), bone text, one marquee-amber accent used only on things you can press (Play, active chip, focus ring). Bricolage Grotesque for the title and section headings, Geist for UI and body, Geist Mono for the single metadata line. Flat surfaces, hairline borders at 14% bone, 8px radius on controls and posters, tinted soft shadows. No glass, no glow, no gradient text.

STORY: The visitor arrives and a pick is already there. They read one title, one meta line, one reason. They press Play, or say Not tonight and the next one lights up. The app learns from thumbs; it never asks them to browse.

FIRST VIEWPORT: Backdrop fills the viewport under a warm scrim darker on the left. Floating top bar: wordmark, Search, Watchlist, History, avatar. Left column (620px at 1440): mood input, four chips, then title at display scale, mono meta line, two-line reason, Play (amber) and Not tonight (hairline), a small icon row for save, like, dislike. Poster large at the right. Continue Watching rail peeks at the bottom edge. On phones: single column, poster first, the band is the whole first screen.

FORM: Projection Booth, position 1 of my ordered list, chosen as IMPECCABLE'S PICK over the assigned Leader; seed key 46768110.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
