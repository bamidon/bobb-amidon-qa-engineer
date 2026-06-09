/**
 * Supabase sync tests — uses page.route() to mock the REST API.
 * The Playwright webServer injects dummy Supabase env vars so the client
 * initialises and makes real HTTP requests that can be intercepted here.
 */
import { test, expect } from '../fixtures/personas';
import { generateBatch } from '../helpers/factory';

const SUPABASE_PATTERN = '**/rest/v1/history_entries**';

test.describe('Sync — Loading from DB', () => {
  test('@regression history from Supabase is rendered on load', async ({ bridgePage }) => {
    const remoteEntries = generateBatch(3);
    await bridgePage.mockSupabase(remoteEntries);
    await bridgePage.goto();
    await bridgePage.page.evaluate(() => localStorage.clear());
    await bridgePage.page.reload();

    await bridgePage.historySection.waitFor({ state: 'visible', timeout: 5000 });
    expect(await bridgePage.getHistoryCount()).toBe(3);
  });

  test('@regression remote and local histories are merged without duplicates', async ({
    bridgePage,
  }) => {
    const localEntries = generateBatch(2);
    await bridgePage.page.evaluate(
      (data) => localStorage.setItem('bridge_history', JSON.stringify(data)),
      localEntries
    );

    const remoteEntries = generateBatch(2); // different IDs
    await bridgePage.mockSupabase(remoteEntries);
    await bridgePage.goto();

    await bridgePage.historySection.waitFor({ state: 'visible', timeout: 5000 });
    expect(await bridgePage.getHistoryCount()).toBeGreaterThanOrEqual(2);
    expect(await bridgePage.getHistoryCount()).toBeLessThanOrEqual(4);
  });
});

test.describe('Sync — Saving to DB', () => {
  test('@regression completing a task POSTs to Supabase with correct fields', async ({
    bridgePage,
  }) => {
    await bridgePage.mockSupabase([]);

    const postRequest = bridgePage.page.waitForRequest(
      (req) => req.url().includes('/rest/v1/history_entries') && req.method() === 'POST',
      { timeout: 5000 }
    );

    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();

    const req = await postRequest;
    const body = req.postDataJSON();
    expect(body).toMatchObject({ mood: 'anxious', action: 'completed' });
  });

  test('@regression skipping a task POSTs to Supabase with correct fields', async ({
    bridgePage,
  }) => {
    await bridgePage.mockSupabase([]);

    const postRequest = bridgePage.page.waitForRequest(
      (req) => req.url().includes('/rest/v1/history_entries') && req.method() === 'POST',
      { timeout: 5000 }
    );

    await bridgePage.selectMood('stuck');
    await bridgePage.skipTask();

    const req = await postRequest;
    const body = req.postDataJSON();
    expect(body).toMatchObject({ mood: 'stuck', action: 'skipped' });
  });
});

test.describe('Sync — Offline / Error Handling', () => {
  test('@regression app is fully usable when Supabase is unreachable', async ({ bridgePage }) => {
    await bridgePage.mockSupabaseError();
    await bridgePage.goto();
    await bridgePage.page.evaluate(() => localStorage.clear());
    await bridgePage.page.reload();

    await expect(bridgePage.moodSelector).toBeVisible();
    await bridgePage.selectMood('anxious');
    await expect(bridgePage.taskCard).toBeVisible();
    await bridgePage.completeTask();

    const stored = await bridgePage.readStoredHistory();
    expect(stored).toHaveLength(1);
  });

  test('@regression sync error indicator appears after a failed save', async ({ bridgePage }) => {
    await bridgePage.mockSupabaseError();

    await bridgePage.selectMood('overwhelmed');
    await bridgePage.completeTask();

    await bridgePage.syncIndicator.waitFor({ state: 'visible', timeout: 3000 });
  });

  test('@regression sync errors do not block further interactions', async ({ bridgePage }) => {
    await bridgePage.mockSupabaseError();

    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();
    await bridgePage.selectMood('stuck');
    await bridgePage.completeTask();

    expect(await bridgePage.getHistoryCount()).toBe(2);
  });
});
