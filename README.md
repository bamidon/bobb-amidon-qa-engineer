# Bobb Amidon — QA Engineer

A full-stack QA showcase built around **Bridge**, a behavioral-health micro-activation planner. The app is live at [bridge.stitiousproductions.com](https://bridge.stitiousproductions.com).

---

## Open in Codespaces

Click the button below to launch a fully configured environment in your browser — no installation required. Dependencies and Playwright browsers install automatically (~60 seconds).

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bamidon/bobb-amidon-qa-engineer)

Once the terminal is ready, open the **Testing** panel in VS Code (flask icon in the sidebar) or run from the repo root:

```bash
npm run test:smoke       # fastest pass/fail signal (~15s)
npm run test:regression  # full workflow coverage
npm run test:a11y        # axe scans + ARIA assertions
npm run test:ui          # interactive Playwright UI — opens in your browser on port 8080
npm run test:headed      # run with a visible browser (via Xvfb virtual display)
```

---

## What's here

```
bridge_app/      Vite + React + TypeScript app
bridge_tests/    Playwright test framework
```

### App (`bridge_app`)

- Mood selector → task card → 90-second timer → history
- Supabase sync with optional login (anonymous auth → named account)
- Insights panel: streak, completion rate, go-to mood
- Notes on history entries, date-grouped history list

### Test framework (`bridge_tests`)

| File | What it demonstrates |
|---|---|
| `tests/pages/BridgePage.ts` | Page Object Model — all selectors via `data-testid` |
| `tests/fixtures/personas.ts` | Custom fixtures: clean session, seeded history, auth users |
| `tests/helpers/factory.ts` | Deterministic data builders (batch, streak, mood focus) |
| `tests/helpers/supabaseAdmin.ts` | Ephemeral test user lifecycle via Supabase admin API |
| `tests/e2e/auth.spec.ts` | Real-auth tests: anonymous mode, account creation, data isolation, known fixture user |
| `tests/e2e/sync.spec.ts` | Supabase mocking via `page.route()` — offline/error handling |
| `tests/e2e/accessibility.spec.ts` | axe scans + ARIA + keyboard navigation |
| `tests/e2e/bridge.spec.ts` | Core user flows: mood → task → complete/skip cycles |
| `tests/e2e/history.spec.ts` | localStorage persistence, recording, deletion |
| `tests/e2e/insights.spec.ts` | Computed metrics: completion rate, streaks, most-used mood |

### Test patterns worth noting

- **Ephemeral users** — `createTestUser('label')` creates `test-label-a3f2@bridge.test` via the Supabase admin API, signs in through the real UI, and deletes the account in teardown
- **Fixture users** — `fixture-alice@bridge.test` has pre-seeded history (7-day streak, 15 entries), set up once via `createFixtureUsers.ts`
- **Data isolation** — two browser contexts, two users, assert neither sees the other's data
- **Supabase mocking** — `mockSupabase(entries)` intercepts `/rest/v1/history_entries` with `page.route()` so sync tests run without touching the real DB

---

## Tag-driven test selection

```bash
npm run test:smoke       # @smoke
npm run test:regression  # @regression
npm run test:a11y        # @accessibility
npm run test:auth        # @auth (Supabase credentials pre-configured in Codespaces)
npm run test:prod        # runs against https://bridge.stitiousproductions.com
```
