---
name: deploy-stitious
description: Deploy the Bridge app to bridge.stitiousproductions.com — runs tests, commits, and pushes for auto-deploy via Vercel.
---

# Deploy Bridge to stitiousproductions.com

You are helping deploy the Bridge micro-activation planner to production at **bridge.stitiousproductions.com**.

## Project layout

| Directory | Purpose |
|---|---|
| `~/bridge_app` | React source code (Vite + TypeScript) |
| `~/bridge_tests` | Playwright test framework |
| `~/stitiousproductions` | What Vercel deploys — do NOT manually edit |

Vercel watches **`github.com/bamidon/bridge-app`** and auto-deploys on every push to `master`. There is no manual deploy step.

## Deployment workflow

Follow these steps in order. Do not skip the test step.

### Step 1 — Run smoke tests locally
```bash
cd ~/bridge_tests
npm run test:smoke
```
If any smoke tests fail, stop and fix before continuing.

### Step 2 — Commit and push bridge_app
```bash
cd ~/bridge_app
git add .
git commit -m "<describe what changed>"
git push
```
This triggers Vercel to build and deploy automatically. Wait ~30 seconds for it to go live.

### Step 3 — Verify production
```bash
cd ~/bridge_tests
npm run test:prod
```
This runs all 49 tests against `https://bridge.stitiousproductions.com`. All should pass.

### Step 4 — Commit tests if they changed
If you updated any test files during this session:
```bash
cd ~/bridge_tests
git add .
git commit -m "<describe test changes>"
git push
```

---

## Key URLs
- **Production:** https://bridge.stitiousproductions.com
- **Vercel dashboard:** https://vercel.com
- **bridge-app repo:** https://github.com/bamidon/bridge-app
- **bridge-tests repo:** https://github.com/bamidon/bridge-tests

## If something goes wrong

**Tests fail locally** — fix the code in `~/bridge_app/src/` before pushing.

**Tests fail in production but pass locally** — check the Vercel build log at vercel.com for errors.

**Vercel didn't deploy** — check that the push went through: `git log origin/master` from `~/bridge_app`.

**DNS not resolving** — `bridge.stitiousproductions.com` CNAME points to Vercel via Porkbun. DNS changes can take up to 10 minutes.
