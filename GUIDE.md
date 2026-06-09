# Bridge — QA Showcase Guide

**Live app:** https://bridge.stitiousproductions.com  
**Repo:** https://github.com/bamidon/bobb-amidon-qa-engineer

---

## What you're looking at

Bridge is a behavioral-health micro-activation planner built in React + TypeScript. It's the subject of a full Playwright test framework demonstrating senior QA engineering patterns — page objects, custom fixtures, factory-generated test data, accessibility scanning, Supabase API mocking, and a real-auth test suite with ephemeral user lifecycle management.

---

## Running the tests in your browser (no install needed)

1. Open **https://github.com/bamidon/bobb-amidon-qa-engineer**
2. Click the green **Code** button → **Codespaces** tab → **Create codespace on master**
3. Wait ~90 seconds for the environment to build
4. In the terminal that appears:

```bash
cd bridge_tests
npm run test:ui
```

This opens the **Playwright interactive UI** — pick any test or suite, watch it run in a live browser, inspect each step.

Other commands:

```bash
npm run test:smoke       # 6 tests — fastest sanity check (~15s)
npm run test:regression  # full workflow coverage
npm run test:a11y        # axe accessibility scans + ARIA assertions
npm run test:prod        # runs against the live production URL
```

---

## What to look at in the code

| File | What it shows |
|---|---|
| `bridge_tests/tests/pages/BridgePage.ts` | Page Object — all selectors via `data-testid`, auth helpers |
| `bridge_tests/tests/fixtures/personas.ts` | Custom fixtures: clean session, seeded history, ephemeral auth users |
| `bridge_tests/tests/helpers/factory.ts` | Deterministic data builders — batch, streak, mood focus |
| `bridge_tests/tests/helpers/supabaseAdmin.ts` | Test user lifecycle: create, seed history, delete via admin API |
| `bridge_tests/tests/e2e/auth.spec.ts` | Auth flows: anonymous mode, account creation, data isolation between users, known fixture user with pre-seeded history |
| `bridge_tests/tests/e2e/sync.spec.ts` | Supabase mocking via `page.route()` — offline and error-handling coverage |
| `bridge_tests/tests/e2e/accessibility.spec.ts` | axe scans + ARIA roles + keyboard navigation |

---

## Test architecture highlights

**Ephemeral users** — Each auth test creates a real Supabase account (`test-fresh-a3f2@bridge.test`) via the admin API, signs in through the actual UI, and deletes the account in teardown. No shared state between runs.

**Known fixture user** — `fixture-alice` is a permanent test account with a pre-seeded 7-day streak and 15 history entries. Tests against her assert on predictable, known data without building state through the UI.

**Data isolation** — One test opens two independent browser contexts, signs in as two different users, and asserts that neither can see the other's history.

**Supabase mocking** — The sync and offline tests intercept all Supabase REST calls with `page.route()`, returning controlled responses without touching the real database.
