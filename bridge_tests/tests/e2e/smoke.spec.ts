/**
 * Smoke tests — the minimal bar for "is the app alive?"
 * Run with: npm run test:smoke
 */
import { test, expect } from '../fixtures/personas';

const ALL_MOODS = ['anxious', 'stuck', 'overwhelmed', 'low-energy', 'avoidant'] as const;

test.describe('Smoke', () => {
  test('@smoke app loads and mood selector is visible', async ({ bridgePage }) => {
    await expect(bridgePage.moodSelector).toBeVisible();
  });

  test('@smoke page title is correct', async ({ bridgePage, page }) => {
    await expect(page).toHaveTitle(/Bridge/i);
  });

  test('@smoke all five mood buttons are rendered', async ({ bridgePage, page }) => {
    for (const mood of ALL_MOODS) {
      await expect(page.getByTestId(`mood-button-${mood}`)).toBeVisible();
    }
  });

  test('@smoke selecting a mood shows the task card and hides mood selector', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await expect(bridgePage.taskCard).toBeVisible();
    await expect(bridgePage.moodSelector).not.toBeVisible();
  });

  test('@smoke task card exposes title, description, and action buttons', async ({ bridgePage }) => {
    await bridgePage.selectMood('stuck');
    await expect(bridgePage.taskTitle).toBeVisible();
    await expect(bridgePage.taskDescription).toBeVisible();
    await expect(bridgePage.completeButton).toBeVisible();
    await expect(bridgePage.skipButton).toBeVisible();
  });

  test('@smoke history section is hidden on a clean session', async ({ bridgePage }) => {
    await expect(bridgePage.historySection).not.toBeVisible();
  });
});
