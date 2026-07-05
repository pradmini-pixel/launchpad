# DayOne

A daily morning launchpad. Not a dashboard — a 6–10 minute guided ritual you
open once, before email, to start the day focused, confident, and informed.
When the sequence ends, the app's job is done: it tells you to go start the day
and gets out of the way.

## The sequence

One idea per screen, in order:

1. **Arrive** — one slow breath. A single thin circle expands and contracts.
   Skippable in one tap; after a 7-day streak it stops insisting.
2. **Reframe** — name the thought weighing on you. A light CBT reframe answers:
   the distortion pattern (if obvious), one honest counter-question, one
   balanced restatement. Skip it and you get a single grounding line instead.
3. **Executive Voice Rep** — one micro-drill for speaking to senior leadership
   (30-second answer, cut-it-in-half, lead-with-the-headline, push-back). You
   answer, and get specific coaching: one strength, one thing to tighten.
4. **The Briefing** — 3–5 typographic headline cards (Workday, HR tech,
   enterprise AI, one founder wildcard). Tap to expand; each ends with "why it
   matters to you." No feed, no infinite scroll.
5. **Focus** — today's Top 3: day job, venture, flexible. Yesterday's unfinished
   items roll over with a gentle "still yours?". The #1 item asks for the first
   physical action.
6. **Launch** — the date, your three, your rep count and streak, one quiet line,
   then **Go**. No further navigation.

## Design

Warm off-white canvas (`#FAFAF8`), optional near-black dark mode, essentially
monochrome ink and two grays, and a single accent (`#0071E3`) reserved for the
one primary action per screen. Typography is the interface: a system grotesque
(SF / Inter), a tight hierarchy, extravagant margins, hairline dividers, slow
eased motion. Progress is five hairline dots.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pure sequenceEngine + streak unit tests
npm run build    # typecheck + production build
```

Mobile-first — it's built to be opened on a phone with morning coffee, and it's
beautiful on desktop.

## AI integration & providers

DayOne is **local-first**. All history, streaks, and settings live in
`localStorage`; nothing leaves the device unless you opt into an AI provider.

By default DayOne runs **fully on-device** — no key, no network, no setup. The
reframe and voice-rep coaching use built-in heuristics, the drill rotates
through a local pool, and the Briefing shows a curated sample. This is the mode
that ships on GitHub Pages, and it needs nothing configured.

Four surfaces can be upgraded with a provider you pick in **Settings → Coaching
engine**:

| Provider | Cost | Works on a static host? | Live briefing? |
|---|---|---|---|
| **On-device** (default) | Free | Yes — nothing to configure | Sample briefing |
| **Claude (Anthropic)** | Pay-as-you-go | Yes — calls the API directly from the browser | Yes — `web_search` |
| **Ollama (local)** | Free | Only where Ollama runs | Sample briefing |
| **OpenAI-compatible** | Varies | Depends on the endpoint's CORS | Sample briefing |

Any key you enter is stored only in that browser's `localStorage` and sent
directly to the provider — no server, no shared secret. Every call has a
timeout and a graceful fallback to the on-device behaviour, so the ritual is
never blocked and never shows a broken screen.

## Deploying (a public URL, from anywhere)

The build is a static site (`base: "./"`), so it hosts anywhere with no server.
`.github/workflows/deploy.yml` builds and publishes `dist` to the **`gh-pages`**
branch on every push to the app branch (via `peaceiris/actions-gh-pages`).

**GitHub Pages** → `https://<user>.github.io/<repo>/`:

1. Push the app branch — the workflow builds and updates `gh-pages`.
2. Repo → **Settings → Pages → Build and deployment → Source: "Deploy from a
   branch" → Branch: `gh-pages` → `/ (root)` → Save**.

That's the whole deploy, and it's automatic thereafter. The on-device default
needs nothing else — the full ritual (breath, reframe, voice rep, briefing,
focus, launch, streaks, weekly review) works on the live site with no key and
no proxy. If you later want tailored AI on the hosted site, **Claude** works
directly from the browser with no extra infrastructure.

## Architecture

- **React + Vite + TypeScript**, single-page, local-first.
- `src/lib/sequenceEngine.ts` — pure state machine for ordering, skipping, and
  completion. Fully unit-tested (`sequenceEngine.test.ts`).
- `src/lib/streak.ts` — gentle streak math (a miss erodes by one, never resets
  to zero). Unit-tested.
- `src/lib/claude.ts` — provider-agnostic typed client (Claude SDK or any
  OpenAI-compatible endpoint): reframe, coaching, drill generation, briefing —
  each with a timeout and a local fallback.
- `src/lib/storage.ts` — the single `localStorage` payload.
- `src/store.tsx` — React context holding app data and the day's record.
- `src/components/*` — one component per screen, plus `SequenceShell`,
  `WeeklyReview` (Sundays), and `Settings`.
