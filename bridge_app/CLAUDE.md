# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Bridge** — a Vite + React + TypeScript micro-activation planner for behavioral health. The user selects a mood (anxious, stuck, overwhelmed, low-energy, avoidant) and receives a 90-second grounding task. Completed and skipped tasks are saved to `localStorage` and rendered in a History section. There is no backend.

## Commands

```bash
npm install              # first-time setup + install Playwright browsers
npx playwright install   # download browser binaries after npm install

npm run dev              # start Vite dev server (http://localhost:5173)
npm run build            # TypeScript check + Vite production build
npm run test             # run all Playwright tests (starts dev server automatically)
npm run test:smoke       # @smoke tag — fastest pass/fail signal
npm run test:regression  # @regression tag — full workflow coverage
npm run test:a11y        # @accessibility tag — axe scans + ARIA assertions
npm run test:headed      # run tests with browser visible (useful for debugging)
npm run test:ui          # Playwright UI mode (interactive test runner)
npm run test:debug       # step-debugger mode
npm run report           # open last HTML report
```

Run a single spec file:
```bash
npx playwright test tests/e2e/history.spec.ts
```

Run a single test by title:
```bash
npx playwright test --grep "Skip cycles through"
```

Limit to one browser:
```bash
npx playwright test --project=chromium
```

## Architecture

```
src/
  types.ts              — Mood, Task, TaskStatus, HistoryEntry (shared by app & tests)
  data/tasks.ts         — TASKS: Record<Mood, Task[]>  (3 tasks per mood, deterministic)
  App.tsx               — all state: currentMood, currentTask, taskStatus, timeLeft, history
  components/
    MoodSelector.tsx    — presentational; emits onMoodSelect(mood)
    TaskCard.tsx        — presentational; receives timer props, emits start/complete/skip/back
    HistoryList.tsx     — presentational; renders HistoryEntry[]

tests/
  pages/BridgePage.ts   — Page Object; all selectors use data-testid
  fixtures/personas.ts  — custom test fixture; exports bridgePage (clean) and pageWithHistory (seeded)
  e2e/
    smoke.spec.ts       — @smoke: app loads, buttons visible
    bridge.spec.ts      — @regression: mood → task → start/complete/skip flows
    history.spec.ts     — @regression: recording, ordering, localStorage persistence
    accessibility.spec.ts — @accessibility: axe scans + ARIA + keyboard
```

## Key design decisions

- **State lives entirely in `App.tsx`** — components are pure/presentational. Adding a context or state library would require changes only to `App.tsx`.
- **`data/tasks.ts` is the ground truth** — tests import from it directly to assert expected titles, so task copy changes propagate automatically without hardcoded strings in specs.
- **All test selectors use `data-testid`** — CSS class or text changes cannot break tests.
- **Fixtures in `personas.ts` seed `localStorage` before the page loads** — this makes history tests deterministic without clicking through the UI.
- **`BridgePage` exposes `readStoredHistory()`** — lets tests validate persistence at the storage layer, not just the rendered DOM.
- **Tags drive CI filtering** — `@smoke` in the test title enables `--grep @smoke` without any config changes.

## Data flow

```
selectMood(mood)
  → currentMood, currentTask = TASKS[mood][0], status = 'idle'

startTask()
  → status = 'started' → useEffect sets up setInterval countdown

completeTask()
  → push HistoryEntry (action:'completed') → reset to mood selector

skipTask()
  → push HistoryEntry (action:'skipped') → advance to next task (cycling)
```

## Playwright config

- `testDir`: `./tests/e2e`
- Projects: chromium, firefox, webkit, Pixel 5, iPhone 13
- `webServer`: starts `npm run dev` automatically; reuses running server outside CI
- Artifacts on failure: trace (on first retry), screenshot, video
