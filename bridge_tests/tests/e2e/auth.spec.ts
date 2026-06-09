/**
 * Auth tests — require real Supabase credentials.
 * Run with: npm run test:auth
 * (Sets USE_REAL_SUPABASE=1 so the dev server uses real Supabase env vars.)
 *
 * Prerequisites:
 *   1. SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env
 *   2. Anonymous sign-ins enabled in Supabase Auth settings
 *   3. fixture-alice@bridge.test created (run: npx tsx tests/helpers/createFixtureUsers.ts)
 */
import { test as base, expect } from '@playwright/test';
import { BridgePage } from '../pages/BridgePage';
import { createTestUser, deleteTestUser, seedUserHistory, FIXTURE_USERS } from '../helpers/supabaseAdmin';
import { generateBatch, makeStreak } from '../helpers/factory';

// ── Fixtures ──────────────────────────────────────────────────────

type AuthFixtures = {
  anonPage: BridgePage;
  freshUser: { page: BridgePage; id: string; email: string; password: string };
  knownUser: BridgePage;
};

const test = base.extend<AuthFixtures>({
  anonPage: async ({ page }, use) => {
    const bridge = new BridgePage(page);
    await bridge.goto();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await use(bridge);
  },

  freshUser: async ({ page }, use) => {
    const u = await createTestUser('fresh');
    const bridge = new BridgePage(page);
    await bridge.goto();
    await bridge.signInViaModal(u.email, u.password);
    await use({ page: bridge, ...u });
    await deleteTestUser(u.id);
  },

  knownUser: async ({ page }, use) => {
    const alice = FIXTURE_USERS.alice;
    const bridge = new BridgePage(page);
    await bridge.goto();
    await bridge.signInViaModal(alice.email, alice.password);
    await use(bridge);
    await bridge.signOut();
  },
});

// ── Anonymous mode ────────────────────────────────────────────────

test.describe('Auth — Anonymous Mode', () => {
  test('@regression @auth app works without signing in', async ({ anonPage }) => {
    await expect(anonPage.moodSelector).toBeVisible();
    expect(await anonPage.isAnonymous()).toBe(true);
  });

  test('@regression @auth anonymous history saves to localStorage', async ({ anonPage }) => {
    await anonPage.selectMood('anxious');
    await anonPage.completeTask();
    const stored = await anonPage.readStoredHistory();
    expect(stored).toHaveLength(1);
    expect(stored[0].action).toBe('completed');
  });

  test('@regression @auth account button is visible in anonymous state', async ({ anonPage }) => {
    await expect(anonPage.page.getByTestId('account-button')).toBeVisible();
    await expect(anonPage.page.getByTestId('account-pill')).not.toBeVisible();
  });
});

// ── Account creation ──────────────────────────────────────────────

test.describe('Auth — Account Creation', () => {
  test('@regression @auth saving account shows email in header', async ({ freshUser }) => {
    const email = await freshUser.page.getAccountEmail();
    // Email may be truncated — check it starts with expected prefix
    expect(email).not.toBeNull();
    expect(freshUser.email.startsWith((email ?? '').replace('…', ''))).toBe(true);
  });

  test('@regression @auth history is preserved after account creation', async ({ page }) => {
    const u = await createTestUser('preserve');
    const bridge = new BridgePage(page);
    await bridge.goto();

    // Record a task anonymously
    await bridge.selectMood('stuck');
    await bridge.completeTask();
    expect(await bridge.getHistoryCount()).toBe(1);

    // Save account — anonymous session upgrades in place
    await bridge.saveAccount(u.email, u.password);

    // History remains (it was in localStorage, session continues)
    expect(await bridge.getHistoryCount()).toBe(1);

    await deleteTestUser(u.id);
  });

  test('@regression @auth can sign out and sign back in', async ({ freshUser }) => {
    const { page: bridge, email, password } = freshUser;

    await bridge.signOut();
    expect(await bridge.isAnonymous()).toBe(true);

    // Sign back in
    await bridge.signInViaModal(email, password);
    const displayedEmail = await bridge.getAccountEmail();
    expect(displayedEmail).not.toBeNull();
  });
});

// ── Data isolation ────────────────────────────────────────────────

test.describe('Auth — Data Isolation', () => {
  test('@regression @auth two users see only their own history', async ({ browser }) => {
    const userA = await createTestUser('alice-isolation');
    const userB = await createTestUser('bob-isolation');

    // User A: record a task
    const ctxA = await browser.newContext();
    const pageA = new BridgePage(await ctxA.newPage());
    await pageA.goto();
    await pageA.signInViaModal(userA.email, userA.password);
    await pageA.selectMood('anxious');
    await pageA.completeTask();
    expect(await pageA.getHistoryCount()).toBe(1);

    // User B: signs in, should see no history from user A
    const ctxB = await browser.newContext();
    const pageB = new BridgePage(await ctxB.newPage());
    await pageB.goto();
    await pageB.signInViaModal(userB.email, userB.password);
    expect(await pageB.getHistoryCount()).toBe(0);

    await ctxA.close();
    await ctxB.close();
    await deleteTestUser(userA.id);
    await deleteTestUser(userB.id);
  });
});

// ── Known user (fixture-alice) ────────────────────────────────────

test.describe('Auth — Known User', () => {
  test('@regression @auth fixture user history loads on sign-in', async ({ knownUser }) => {
    // fixture-alice has pre-seeded history — expect the history section to be visible
    await expect(knownUser.historySection).toBeVisible();
    expect(await knownUser.getHistoryCount()).toBeGreaterThan(0);
  });

  test('@regression @auth insights panel reflects fixture user streak', async ({ knownUser }) => {
    // fixture-alice has a 7-day streak seeded by createFixtureUsers
    await expect(knownUser.insightsPanel).toBeVisible();
    const streak = await knownUser.streakCount.textContent();
    expect(Number(streak)).toBeGreaterThanOrEqual(7);
  });
});
