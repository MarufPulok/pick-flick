---
name: Pick Flick
description: One pick for tonight, lit like a picture in a dark room.
colors:
  marquee-amber: "oklch(0.78 0.15 72)"
  booth-black: "oklch(0.17 0.012 70)"
  booth-card: "oklch(0.2 0.013 70)"
  booth-surface: "oklch(0.22 0.014 70)"
  bone: "oklch(0.92 0.016 85)"
  dim-bone: "oklch(0.66 0.02 80)"
  hairline: "oklch(0.92 0.016 85 / 14%)"
  signal-red: "oklch(0.62 0.19 25)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Geist, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, Geist, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, Geist, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Bricolage Grotesque, Geist, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.556
  wordmark:
    fontFamily: "Bricolage Grotesque, Geist, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body-lead:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  meta:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "\"tnum\" 1"
rounded:
  sm: "6px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "64px"
  gutter-desktop: "60px"
components:
  button-play:
    backgroundColor: "{colors.marquee-amber}"
    textColor: "{colors.booth-black}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-play-hover:
    backgroundColor: "oklch(0.78 0.15 72 / 0.9)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "oklch(0.92 0.016 85 / 0.06)"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.dim-bone}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.full}"
    size: "40px"
  button-icon-on:
    backgroundColor: "oklch(0.78 0.15 72 / 0.15)"
    textColor: "{colors.marquee-amber}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  chip-active:
    backgroundColor: "{colors.marquee-amber}"
    textColor: "{colors.booth-black}"
  input-text:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  select:
    backgroundColor: "{colors.booth-black}"
    textColor: "{colors.bone}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  segment:
    backgroundColor: "transparent"
    textColor: "{colors.dim-bone}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "28px"
  segment-active:
    backgroundColor: "oklch(0.92 0.016 85 / 0.1)"
    textColor: "{colors.bone}"
  poster-tile:
    backgroundColor: "{colors.booth-surface}"
    rounded: "{rounded.md}"
    width: "130px"
---

# Design System: Pick Flick

## Overview

**Creative North Star: "The Projection Booth"**

Pick Flick is one lit picture in a dark room. The current pick's backdrop fills the viewport under a warm scrim. The title, a single mono metadata line and a short reason sit in the darker part of that scrim, and everything else stays in the dark around it. The ground is a warm off-black, the text is bone, and one marquee amber marks the things you can press. Nothing else on the screen has a color of its own. The imagery comes from TMDB and supplies all the color the room needs.

The world is dark only (`color-scheme: dark`, no light tokens). Surfaces are flat. A 14% bone hairline is what separates things. The one shadow in the system belongs to the large hero poster, so the picture looks lifted off the wall. Density is low. A screen produces one pick or helps you act on one, and secondary rails (Continue watching, Trending) sit below it at a smaller scale.

Motion is a single gesture, **lights down, lights up**. The moment a chip or Not tonight is pressed, the room dims: the backdrop and scrim drop to 35% and the text and poster to 50% in 150ms, and the pressed chip breathes (`animate-lamp`, a 900ms opacity pulse) until the pick lands. The outgoing backdrop stays in place, and the new one lights up over it from 40% brightness to full in 480ms on an exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`); the poster rises 8px with it and the text follows 120ms behind. No blur. Under `prefers-reduced-motion: reduce` every entrance becomes a 200ms fade, shimmer stops, and the lamp pulse stays because it is feedback. Every button presses down 1px; chips and icon toggles also scale to 97% and 95%; a Like, Dislike or Never again glyph stamps (scales to 130% and back in 260ms). Any control that is waiting on the server carries `aria-busy` and breathes. Lists that arrive as lists (rails, grids, onboarding chips) rise in with a 40ms stagger, capped at 320ms. Skeletons carry a slow light pass (`.skeleton`). Panels, dropdowns, the banner and the player enter with a 150 to 300ms fade from `@starting-style`; exits are instant. A tapped tile or nav link breathes while the route is pending (`LinkBody`, via `useLinkStatus`).

**Key Characteristics:**
- Warm off-black room, bone text, one amber accent for pressable things.
- Full-bleed backdrop under a warm scrim that is darker where the text sits.
- Bricolage Grotesque display at weight 600, -0.02em tracking. Geist for UI. Geist Mono for metadata.
- Hairlines instead of fills or shadows. One poster shadow.
- 8px corners on controls and posters, 6px on small inputs, full radius on chips and icon toggles.
- One entrance animation (lights up), reduced to a fade under reduced motion. Poster images fade in over their shimmering bone skeleton in 300ms once decoded; this is loading feedback, not an entrance.

## Colors

The palette is a warm off-black room (hue 70) lit by bone text and a single marquee amber.

### Primary
- **Marquee Amber** (marquee-amber): the only chromatic color in the interface. It is used for Play and every primary CTA ("Get tonight's pick", "Sign in", "Pick with these"), active mood and taste chips, toggled-on icon buttons (amber border, 15% amber fill, amber glyph), the global `:focus-visible` outline, the text caret, `::selection` (35% amber), and focused dropdown items. Hover lowers it to 90%. Loading skeletons show the Play slot as 30% amber.

### Neutral
- **Booth Black** (booth-black): the page ground. It is also the text color on amber, and it is the base of every scrim gradient.
- **Booth Card** (booth-card): popover and dropdown panels.
- **Booth Surface** (booth-surface): wells behind poster tiles before the image loads, the search suggestion panel, and the avatar fallback.
- **Bone** (bone): primary text, the onboarding progress fill, and the base for every translucent tint. Bone at 6% is the hover wash, 10% is skeletons and the selected segment, 18-30% is the scrollbar thumb, 40% is the hover border on a poster tile, and 85% is the reason line under the title.
- **Dim Bone** (dim-bone): secondary text, metadata lines, placeholders, and unselected segments.
- **Hairline** (hairline): every border, divider and progress track, plus the decoration color for underlined inline links.
- **Signal Red** (signal-red): error text only. The login failure message is its only current use.

### Named Rules
**The Marquee Rule.** Amber goes only on things you can press, and on the focus and selection states of those things. Headings, progress, metadata and decoration never use it. Selected segments in a segmented control use a 10% bone wash, not amber.

**The One Room Rule.** The app has one theme, and it is dark. Do not add a light variant or a second accent hue. Color for a scene comes from the TMDB imagery, never from the chrome.

## Typography

**Display Font:** Bricolage Grotesque (fallback Geist, sans-serif). It loads with the `opsz` and `wdth` axes, and `font-optical-sizing: auto` is on.
**Body Font:** Geist (sans-serif)
**Label/Mono Font:** Geist Mono, always with tabular numerals.

**Character:** Bricolage is a characterful, slightly condensed grotesque that sets titles the way a cinema marquee would. Geist stays quiet and neutral under it. Geist Mono gives metadata the look of a projectionist's log.

### Hierarchy
- **Display** (600, clamp(2.75rem, 7vw, 5.5rem), 0.95): the pick title and the landing hero line. Titles longer than 22 characters drop to clamp(2.25rem, 5.5vw, 4.25rem). Display text is balanced (`text-wrap: balance`).
- **Headline** (600, 2.25rem stepping to 3rem at 640px, -0.02em): landing section headings.
- **Title** (600, 1.875rem, -0.02em): onboarding step questions and empty or error states on the pick screen, which step to 2.25rem at 640px.
- **Title Small** (600, 1.125rem): rail and section headings ("Continue watching", "Trending today") and the player title bar.
- **Wordmark** (700, 1.25rem, -0.01em): "Pick Flick" in the nav and footer. It is the only weight-700 setting.
- **Body Lead** (400, 1.125rem stepping to 1.25rem, 1.625): the reason line and hero subcopy, at 85% bone, max 520px.
- **Body** (400, 1rem, 1.5): supporting copy, usually dim bone.
- **Label** (500, 15px): button and nav text. Small controls use 14px, and segments use 12px.
- **Meta** (Geist Mono 400, 0.875rem, tabular numerals): year · language · type · rating, with parts joined by " · ". Poster tiles use 0.75rem.

### Named Rules
**The One Marquee Rule.** Each viewport gets at most one display-scale title: the pick, or the hero line. Every other heading steps down to headline or smaller.

**The Mono Meta Rule.** Factual metadata (years, ratings, languages, counts, page numbers) is set in Geist Mono with tabular numerals, in dim bone, on one line separated by " · ". Do not put metadata in pills or badges.

## Layout

All layouts use a centered container 1320px wide. Side gutters are 16px on phones, 24px from 640px, and 60px from 1024px. The fixed top bar is 64px tall and floats over content. Its only backing is a booth-black gradient that runs from 85% to transparent.

On the pick screen at 1024px and wider, a two-column grid places a flexible text column (max 620px) on the left and a 360px poster column on the right, with a 64px gap and 120px of top padding. Below 1024px it collapses to one column. The poster moves to the top at min(34vw, 140px), and the mood input and chips follow the title. The landing hero uses the same grid.

Rails scroll horizontally with a 16px gap and a hidden scrollbar. Their tiles are 110px wide, or 130px from 640px. The search results grid has 2, 4 and 6 columns at the base, 640px and 1024px breakpoints, with 16px gaps. Onboarding uses a single 720px column. Landing sections have 96px of vertical padding, or 128px from 1024px.

Spacing follows a 4px base (4, 8, 16, 24, 32, 64). Groups of chips and buttons use 8 to 12px gaps. Blocks are separated by 20 to 32px, and major regions by 64px.

### Named Rules
**The Scrim Rule.** A full-bleed backdrop always sits under the `.scrim` layer. On desktop the scrim runs horizontally, from 92% booth-black on the left to 35% on the right, with a vertical fade to 98% at the bottom. Under 1024px it runs vertically, from 55% to 98%. Text never sits directly on a raw backdrop.

## Elevation & Depth

The system is flat. Depth comes from the scrim over the backdrop and from hairlines, not from stacked tonal cards or shadows. Panels such as the refine box, segmented controls, rails and the player frame are transparent or booth-black, outlined by a 14% bone hairline.

### Shadow Vocabulary
- **Poster** (`box-shadow: 0 30px 60px oklch(0 0 0 / 0.55)`): used only on large feature posters, meaning the 360px pick poster and the landing posters. Rail and grid tiles never get it.

### Named Rules
**The Hairline Rule.** Elements are separated by a 1px border at 14% bone. Do not add background fills to make a container read as a card.

**The Lit Poster Rule.** Only the poster of the current or featured pick casts a shadow. If a second thing on the screen has a shadow, one of them is wrong.

## Shapes

Corners are gentle and few. Buttons, text inputs, posters, tiles, panels and the player frame use 8px. Small controls use 6px: segments, selects, skeleton text bars, and search thumbnails. Mood and taste chips, icon toggles, the avatar, the tile remove button and person portraits are fully round. Posters are always 2:3. Rounded corners are clipped with `overflow: hidden` so images follow the corner.

## Components

### Buttons
Buttons are solid, low and confident, and there are only four kinds.
- **Shape:** gently rounded (8px). Height is 48px, or 36px for the small size.
- **Play:** amber fill with booth-black label (15px, weight 500). Hover drops to 90% amber. This is the primary action, so use it once per decision point.
- **Ghost:** a hairline outline with bone text and a transparent fill. Hover adds a 6% bone wash. It is the secondary action, for example "Not tonight" next to Play, where both are 160px wide.
- **Quiet:** no border, dim bone text that turns bone on hover. Used for tertiary actions such as "Refine" and "Back to my taste".
- **Icon toggle:** a 40px circle with a hairline border and a 16px glyph at 1.5 stroke. When on, it gets an amber border, a 15% amber fill and an amber glyph (Save, Like, Dislike, Never again).
- **States:** a 150ms transition on color and border, a 1px press-down on active (icon toggles also scale to 95%), the lamp pulse while `aria-busy`, and 50% opacity when disabled. Focus uses the global 2px amber outline at a 2px offset.

### Chips
- **Style:** fully round with a hairline border and bone text. Mood chips are 36px tall and onboarding taste chips are 40px, both with 16px horizontal padding and 14px text.
- **Layout:** on the pick screen, mood chips sit in one horizontally scrolling row that runs to the screen edges on phones, and wrap from 1024px. Onboarding chips always wrap.
- **State:** a selected or active chip is solid amber with booth-black text at weight 500. Hover on an unselected chip adds a 6% bone wash; press scales to 97%; a chip whose pick is still loading breathes (`data-working`). Use `aria-pressed` for toggled chips.

### Segmented Control
- **Style:** a hairline-bordered 8px container with 4px padding. Segments are 28px tall, 6px radius and 12px text.
- **State:** the selected segment gets a 10% bone wash and bone text. Unselected segments are dim bone and turn bone on hover. These are view filters (trending type, search type, rating, player source), so they never use amber.

### Cards / Containers
- **Poster tile:** a 2:3 image with 8px corners, a hairline border and a booth-surface well. On hover the border goes to 40% bone. Below it sits a two-line 14px title and, optionally, a 12px mono rating. No shadow and no overlay text.
- **Panels:** the refine panel, search suggestions and player frame use 8px corners and a hairline border, with transparent, booth-surface or booth-black fills. Internal padding is 16px.
- **Skeletons:** blocks of 10% bone that match the final geometry, with a slow light pass (`.skeleton`).

### Inputs / Fields
- **Text input:** 48px tall, 8px corners, hairline border, transparent fill, 16px padding, dim-bone placeholder, amber caret.
- **Focus:** the border turns amber and a 3px ring of 35% amber appears.
- **Select:** 40px tall, 6px corners, booth-black fill, with a dim-bone label above at 14px. On focus the border turns amber.
- **Error:** inline signal-red text at 14px.

### Navigation
- **Style:** a fixed 64px bar with the Bricolage wordmark on the left and text links (Search, Watchlist, History) at 15px on the right. The avatar is 32px, round, with a hairline border.
- **States:** links rest at 75% opacity and go to 100% when active or hovered. The nav does not use amber, except for the "Sign in" button when signed out. The bar is hidden on `/watch`.

### Progress Bar
A 2px hairline track with a bone fill that animates its width. Progress is information, so it never uses amber.

### Pick Block (signature)
The scrim-backed pick: a display title, a mono meta line with an optional underlined "Trailer" link, a body-lead reason (max 520px), a Play + Not tonight row, then a row of icon toggles. The backdrop lights up with `.lights-up`, the poster rises with `.reel-swap`, and the text with `.reel-swap-late`. While the next pick loads, the room dims (backdrop 35%, content 50%) and nothing is cleared; the previous backdrop stays underneath so the swap is a cross-fade.

## Do's and Don'ts

### Do:
- **Do** keep amber for pressable things and their focus or selection states (The Marquee Rule).
- **Do** put every full-bleed image under the `.scrim` utility, which turns vertical below 1024px.
- **Do** set titles in Bricolage Grotesque at weight 600 with -0.02em tracking, and metadata in Geist Mono with tabular numerals.
- **Do** separate things with the 14% bone hairline, and save `shadow-poster` for the one featured poster.
- **Do** use 8px corners on controls and posters, 6px on small inputs and segments, and full radius on chips and icon toggles.
- **Do** dim the room while a pick loads and bring the new one in with `.lights-up` / `.reel-swap` / `.reel-swap-late`; keep the reduced-motion override.
- **Do** draw icons as 16px line glyphs at 1.5 stroke.

### Don't:
- **Don't** use amber on headings, progress, selected segments or decorative fills.
- **Don't** add a light theme or a second accent hue.
- **Don't** use glassmorphism (backdrop blur), decorative glows, or gradient text. The world's only gradients are the scrim and the nav fade.
- **Don't** put shadows on tiles, panels, buttons or menus.
- **Don't** wrap metadata in pills or badges. It belongs on the mono meta line.
- **Don't** put more than one display-scale title in a viewport.
