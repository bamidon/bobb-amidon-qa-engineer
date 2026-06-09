/**
 * History persistence tests — localStorage round-trips and ordering.
 */
import { test, expect } from '../fixtures/personas';
import { SEED_HISTORY } from '../fixtures/personas';
import { TASKS } from '../bridge_app/src/data/tasks';

test.describe('History — Empty State', () => {
  test('@regression history section is hidden when localStorage is empty', async ({ bridgePage }) => {
    await expect(bridgePage.historySection).not.toBeVisible();
  });
});

test.describe('History — Recording', () => {
  test('@regression completing a task adds one entry with the correct badge', async ({
    bridgePage,
  }) => {
    await bridgePage.selectMood('anxious');
    const title = await bridgePage.getTaskTitle();

    await bridgePage.completeTask();

    await expect(bridgePage.historySection).toBeVisible();
    expect(await bridgePage.getHistoryCount()).toBe(1);

    const entry = await bridgePage.getMostRecentHistoryEntry();
    await expect(entry).toContainText(title);
    await expect(entry.getByTestId('history-badge-completed')).toBeVisible();
  });

  test('@regression skipping a task adds one entry with the skipped badge', async ({
    bridgePage,
  }) => {
    await bridgePage.selectMood('stuck');
    const title = await bridgePage.getTaskTitle();

    await bridgePage.skipTask();

    expect(await bridgePage.getHistoryCount()).toBe(1);
    const entry = await bridgePage.getMostRecentHistoryEntry();
    await expect(entry).toContainText(title);
    await expect(entry.getByTestId('history-badge-skipped')).toBeVisible();
  });

  test('@regression multiple actions accumulate as separate entries', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask(); // → mood selector

    await bridgePage.selectMood('stuck');
    await bridgePage.skipTask();    // → next stuck task (stays on task card)
    await bridgePage.goBack();      // → mood selector

    await bridgePage.selectMood('overwhelmed');
    await bridgePage.completeTask(); // → mood selector

    expect(await bridgePage.getHistoryCount()).toBe(3);
  });

  test('@regression most recent action appears at the top of the list', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();

    await bridgePage.selectMood('overwhelmed');
    const secondTitle = await bridgePage.getTaskTitle();
    await bridgePage.completeTask();

    const top = await bridgePage.getMostRecentHistoryEntry();
    await expect(top).toContainText(secondTitle);
  });
});

test.describe('History — Deletion', () => {
  test('@regression deleting an entry removes it from the list', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();
    await bridgePage.selectMood('stuck');
    await bridgePage.completeTask();

    expect(await bridgePage.getHistoryCount()).toBe(2);
    await bridgePage.deleteHistoryEntryAt(0);
    expect(await bridgePage.getHistoryCount()).toBe(1);
  });

  test('@regression deleting the last entry hides the history section', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();

    await bridgePage.deleteHistoryEntryAt(0);
    await expect(bridgePage.historySection).not.toBeVisible();
  });

  test('@regression deletion persists after page reload', async ({ bridgePage, page }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();
    await bridgePage.selectMood('stuck');
    await bridgePage.completeTask();

    await bridgePage.deleteHistoryEntryAt(0);
    await page.reload();

    expect(await bridgePage.getHistoryCount()).toBe(1);
  });
});

test.describe('History — Persistence', () => {
  test('@regression history survives a full page reload', async ({ bridgePage, page }) => {
    await bridgePage.selectMood('low-energy');
    await bridgePage.completeTask();
    const countBefore = await bridgePage.getHistoryCount();

    await page.reload();

    await expect(bridgePage.historySection).toBeVisible();
    expect(await bridgePage.getHistoryCount()).toBe(countBefore);
  });

  test('@regression seeded history is rendered on load', async ({ pageWithHistory }) => {
    await expect(pageWithHistory.historySection).toBeVisible();
    expect(await pageWithHistory.getHistoryCount()).toBe(SEED_HISTORY.length);
  });

  test('@regression seeded history shows correct badge types', async ({ pageWithHistory }) => {
    // SEED_HISTORY = [completed, skipped, completed]
    const entries = await pageWithHistory.historyEntries.all();
    await expect(entries[0].getByTestId('history-badge-completed')).toBeVisible();
    await expect(entries[1].getByTestId('history-badge-skipped')).toBeVisible();
    await expect(entries[2].getByTestId('history-badge-completed')).toBeVisible();
  });

  test('@regression new actions are prepended to seeded history', async ({ pageWithHistory }) => {
    const countBefore = await pageWithHistory.getHistoryCount();

    await pageWithHistory.selectMood('avoidant');
    const newTitle = TASKS['avoidant'][0].title;
    await pageWithHistory.completeTask();

    expect(await pageWithHistory.getHistoryCount()).toBe(countBefore + 1);
    const top = await pageWithHistory.getMostRecentHistoryEntry();
    await expect(top).toContainText(newTitle);
  });

  test('@regression localStorage contains the expected entry count after actions', async ({
    bridgePage,
  }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();
    await bridgePage.selectMood('stuck');
    await bridgePage.skipTask();

    const stored = await bridgePage.readStoredHistory();
    expect(stored).toHaveLength(2);
    expect(stored[0].action).toBe('skipped');
    expect(stored[1].action).toBe('completed');
  });
});
