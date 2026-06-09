import { test as base, expect } from '@playwright/test';
import { BridgePage } from '../pages/BridgePage';
import { HistoryEntry } from '../bridge_app/src/types';
import { generateBatch, makeStreak } from '../helpers/factory';
import { createTestUser, deleteTestUser, seedUserHistory, FIXTURE_USERS, TestUser } from '../helpers/supabaseAdmin';

type BridgeFixtures = {
  bridgePage: BridgePage;
  pageWithHistory: BridgePage;
  pageWithLargeHistory: BridgePage;
  pageWithStreak: BridgePage;
  pageWithInsights: BridgePage;
  /** Ephemeral authenticated user — created fresh, deleted after test. No history. */
  freshUser: { page: BridgePage; user: TestUser };
  /** Fixture user (fixture-alice) with pre-seeded history already in Supabase. */
  knownUser: BridgePage;
};

// Seed data — generated dynamically, consistent enough for badge assertions
export const SEED_HISTORY: HistoryEntry[] = generateBatch(3, {
  moods: ['anxious', 'stuck', 'overwhelmed'],
  actions: ['completed', 'skipped', 'completed'],
});

async function makePage(page: BridgePage, entries: HistoryEntry[]) {
  await page.goto();
  await page.seedHistory(entries);
}

export const test = base.extend<BridgeFixtures>({
  bridgePage: async ({ page }, use) => {
    const bridge = new BridgePage(page);
    await bridge.goto();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await use(bridge);
  },

  pageWithHistory: async ({ page }, use) => {
    const bridge = new BridgePage(page);
    await makePage(bridge, SEED_HISTORY);
    await use(bridge);
  },

  // 20 entries across all moods — exercises history rendering at scale
  pageWithLargeHistory: async ({ page }, use) => {
    const bridge = new BridgePage(page);
    await makePage(bridge, generateBatch(20));
    await use(bridge);
  },

  // 7 consecutive days — produces streak = 7
  pageWithStreak: async ({ page }, use) => {
    const bridge = new BridgePage(page);
    await makePage(bridge, makeStreak(7));
    await use(bridge);
  },

  // 5 entries — just enough to show the insights panel (threshold is 3)
  pageWithInsights: async ({ page }, use) => {
    const bridge = new BridgePage(page);
    await makePage(bridge, generateBatch(5));
    await use(bridge);
  },

  // Creates an ephemeral user, signs in via UI, yields { page, user }. Deletes user after test.
  freshUser: async ({ page }, use) => {
    const testUser = await createTestUser('fresh');
    const bridge = new BridgePage(page);
    await bridge.goto();
    await bridge.signInViaModal(testUser.email, testUser.password);
    await use({ page: bridge, user: testUser });
    await deleteTestUser(testUser.id);
  },

  // Signs in as fixture-alice (permanent user with pre-seeded Supabase history).
  knownUser: async ({ page }, use) => {
    const alice = FIXTURE_USERS.alice;
    const bridge = new BridgePage(page);
    await bridge.goto();
    await bridge.signInViaModal(alice.email, alice.password);
    await use(bridge);
    await bridge.signOut();
  },
});

export { expect };
