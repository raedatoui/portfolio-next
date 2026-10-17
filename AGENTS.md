# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

Personal portfolio for Raed Atoui, live at [raedatoui.com](https://raedatoui.com). Next.js 16 App Router + React 19 + TypeScript + Tailwind v4, statically exported and hosted on Firebase Hosting.

## Commands

```bash
npm run dev        # next dev
npm run build      # next build
npm run lint       # biome lint
npm run format     # biome format --write
npm run check      # biome check --write  (lint + format + organize imports)
```

There is no test framework in this repo.

Deploy is manual: build, then `firebase deploy --only hosting` (project `api-project-992432653598`, `public: "out"`, `cleanUrls: true`, no trailing slash).

## Build config caveat

There is currently **no `next.config.*` file** — `next.config.js` was deleted in commit `5e5132b`. But `firebase.json` serves `out/`, and the last build recorded in `.next/required-server-files.json` ran with `output: 'export'`. A plain `next build` today will not emit `out/`. Before building for deploy, confirm with the user how the static export is meant to be configured rather than guessing.

## Environment

`.env.local` (gitignored) provides:

- `NEXT_PUBLIC_CDN_URL` — every image/logo path in the content JSON is relative (`/assets/images/...`) and gets this prefix at load time. Without it, images resolve against the local origin and `public/assets` is gitignored, so they will 404.
- `NEXT_PUBLIC_GTM_ID` — analytics. `layout.tsx` branches on the prefix: `GTM-*` injects the GTM snippet + noscript iframe, anything else is treated as a GA4 `gtag` id.

Both are read through `src/lib/constants.ts`, never `process.env` directly.

## Architecture

### Content is data, not code

All site copy lives in `src/content/*.json` and is imported statically (`resolveJsonModule`), validated with Zod, and post-processed in `src/lib/LoadContent.ts`. `loadContent()` is called at **module scope** in `src/app/layout.tsx`, so schema violations fail the build rather than the request. The result is passed once into `AppProvider` and read everywhere else via `useApp().content`.

`loadContent()` also mutates the parsed data: it prefixes `CDN_URL` onto `thumb.image`, gallery `image`, and employer `logo`, and normalizes the stray capitalized `Width` key in some gallery entries down to `width`.

**Gotcha:** `WorkDataSchema` declares only `typedef` and `agency`. `work.json` also has a `product` section (2 projects), but Zod strips unknown keys, so it is silently dropped from both the rendered page and `generateStaticParams`. Adding or restoring a top-level work section requires editing the schema in `LoadContent.ts`, not just the JSON.

`src/content/sections.json` is unreferenced — a leftover from an earlier version of the site.

### Routing is an illusion

The site is a single scrolling page. `/` and `/projects/[slug]` both render the same `HomeContent`; the slug is only an *initial* selection.

- `generateStaticParams` in `src/app/projects/[slug]/page.tsx` pre-renders one HTML file per project id so deep links work on static hosting.
- Once hydrated, selecting a project never navigates. `ProjectsGrid` calls `window.history.pushState` directly, updates `document.title`, pushes a manual `page_view` into `dataLayer`, and listens for `popstate` and `Escape` to unwind.

If you change how projects are selected, all four of those side effects live together in `ProjectsGrid.tsx` and need to stay in sync.

### Grid + inline detail

`ProjectsGrid` manually chunks projects into rows using a column count from `useProjectColumns()` (a resize listener mirroring the Tailwind `md`/`lg` breakpoints — 2/3/4). Each row is a `display: contents` wrapper so the CSS grid still lays out flat; the expanded `ProjectInlineDetail` is injected after the row containing the selected card. The JS breakpoints and the grid's Tailwind classes must be changed together or the detail panel opens in the wrong place.

### Pixelation + audio effect

`ProjectCard` and `EmployerLogo` both implement the same hover effect independently: a hidden `<img>` is downsampled into an offscreen canvas and blown back up with `imageSmoothingEnabled = false`, driven by a `requestAnimationFrame` loop throttled to the user-controlled FPS from the header slider. Each step reads a point from `src/lib/Nervous.ts` — a Box-Muller random walk mapped to both a MIDI note (played through Tone.js `PolySynth`) and a pixelation amount. Each card gets a unique `detune` from its index so the grid is polyphonic. All animation state is in refs, deliberately, to keep the RAF loop out of React's render cycle.

Because of the raw canvas work, `ProjectCard` uses a plain `<img>` (with a `biome-ignore` for `noImgElement`) rather than `next/image`.

### Global state

`src/context/AppContext.tsx` holds theme, mute, FPS, selected project, and the loaded content. Theme is a `dark` class toggled on `<html>` plus a `localStorage` write, initialized from `prefers-color-scheme`; `<html>` carries `suppressHydrationWarning`. Mute is applied to `Tone.Destination.mute`.

### Styling

Tailwind v4 via PostCSS only — no `tailwind.config`. Theme tokens are declared in `@theme` in `src/app/globals.css`, with dark-mode values overridden under `.dark`. Note `--invert-filter`, used inline as `filter: var(--invert-filter)` to flip logos and thumbnails in dark mode; `employers.json` entries opt in per-logo via `logo_style` (`default` | `invert` | `theme` | `theme-svg`).

## Conventions

- Biome, not ESLint/Prettier: 4-space indent, 150-char lines, single quotes, semicolons, ES5 trailing commas.
- Components live in `src/components/<Name>/` with a barrel `index.ts` re-exporting the default.
- `@/*` maps to `./src/*`.
- Suppress lint rules inline with a `biome-ignore` comment carrying a real reason, as the existing code does.
