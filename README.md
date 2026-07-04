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

## AI integration & the key

DayOne is **local-first**. All history, streaks, and settings live in
`localStorage`; nothing leaves the device except the Claude API calls.

The Anthropic API powers four things: the CBT reframe, the voice-rep coaching,
the daily drill generation (tuned to your role via the "About me" block in
Settings), and the web-search-backed Briefing. It uses `claude-opus-4-8` by
default and the `web_search` server tool for the Briefing.

Because this is a single-user personal app, the key is kept in a local config:
you paste it into **Settings**, it's stored in `localStorage`, and calls are
made directly from the browser (`dangerouslyAllowBrowser`). That keeps DayOne a
true single-`npm run dev` app with no server to run. The tradeoff is that the
key lives in the browser — fine for a personal device, not for a shared deploy.

**Everything works with zero configuration.** With no key, DayOne runs fully
offline: heuristic reframe and coaching, a rotating local drill, and a seed
briefing. Add a key and those same surfaces light up with tailored Claude
responses. Every API call has a timeout and a graceful fallback — the Briefing
in particular falls back to yesterday's cached cards with a subtle "refreshed
yesterday" note, and never shows a broken screen.

## Architecture

- **React + Vite + TypeScript**, single-page, local-first.
- `src/lib/sequenceEngine.ts` — pure state machine for ordering, skipping, and
  completion. Fully unit-tested (`sequenceEngine.test.ts`).
- `src/lib/streak.ts` — gentle streak math (a miss erodes by one, never resets
  to zero). Unit-tested.
- `src/lib/claude.ts` — thin typed client: reframe, coaching, drill generation,
  briefing — each with a timeout and a local fallback.
- `src/lib/storage.ts` — the single `localStorage` payload.
- `src/store.tsx` — React context holding app data and the day's record.
- `src/components/*` — one component per screen, plus `SequenceShell`,
  `WeeklyReview` (Sundays), and `Settings`.
