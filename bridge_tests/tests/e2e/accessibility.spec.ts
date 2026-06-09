/**
 * Accessibility tests using @axe-core/playwright.
 *
 * We run axe at each major app state and also validate specific ARIA
 * patterns that matter for a health-adjacent product used by people in
 * distress — keyboard operation and live-region announcements are critical.
 *
 * Run with: npm run test:a11y
 */
import { test, expect } from '../fixtures/personas';
import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// Helper: run axe and surface human-readable violation summaries on failure
async function assertNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  if (results.violations.length > 0) {
    const summary = results.violations.map(
      (v) => `[${v.impact}] ${v.id}: ${v.description}`
    );
    expect(summary, 'axe violations found').toEqual([]);
  }
}

test.describe('Automated Axe Scans', () => {
  test('@accessibility no violations on initial load (mood selector)', async ({
    bridgePage,
    page,
  }) => {
    await assertNoViolations(page);
  });

  test('@accessibility no violations with task card visible', async ({ bridgePage, page }) => {
    await bridgePage.selectMood('anxious');
    await assertNoViolations(page);
  });

  test('@accessibility no violations after starting the timer', async ({ bridgePage, page }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.startTask();
    await assertNoViolations(page);
  });

  test('@accessibility no violations after completing a task (history visible)', async ({
    bridgePage,
    page,
  }) => {
    await bridgePage.selectMood('overwhelmed');
    await bridgePage.completeTask();
    await assertNoViolations(page);
  });
});

test.describe('ARIA Roles & Labels', () => {
  test('@accessibility mood buttons carry aria-label describing the feeling', async ({
    bridgePage,
    page,
  }) => {
    const moods = ['anxious', 'stuck', 'overwhelmed', 'low-energy', 'avoidant'];
    for (const mood of moods) {
      const btn = page.getByTestId(`mood-button-${mood}`);
      const label = await btn.getAttribute('aria-label');
      expect(label, `mood button "${mood}" missing aria-label`).toBeTruthy();
      expect(label!.toLowerCase()).toContain('feeling');
    }
  });

  test('@accessibility mood grid has a group role with accessible name', async ({ bridgePage, page }) => {
    const grid = page.getByRole('group', { name: /mood/i });
    await expect(grid).toBeVisible();
  });

  test('@accessibility Start button has a descriptive aria-label', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await expect(bridgePage.startButton).toHaveAttribute('aria-label', /Start/i);
  });

  test('@accessibility Complete button has a descriptive aria-label', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await expect(bridgePage.completeButton).toHaveAttribute('aria-label', /completed/i);
  });

  test('@accessibility Skip button has a descriptive aria-label', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await expect(bridgePage.skipButton).toHaveAttribute('aria-label', /Skip/i);
  });

  test('@accessibility timer display is a live region announced to screen readers', async ({
    bridgePage,
  }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.startTask();
    await expect(bridgePage.timerDisplay).toHaveAttribute('aria-live', 'polite');
    await expect(bridgePage.timerDisplay).toHaveAttribute('aria-atomic', 'true');
  });

  test('@accessibility progress bar exposes aria-valuemin / max / now', async ({ bridgePage, page }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.startTask();
    const bar = page.locator('[role="progressbar"]');
    await expect(bar).toHaveAttribute('aria-valuemin', '0');
    await expect(bar).toHaveAttribute('aria-valuemax', '90');
    // After ~1 second, aria-valuenow should be 1
    await page.waitForTimeout(1100);
    const now = await bar.getAttribute('aria-valuenow');
    expect(Number(now)).toBeGreaterThanOrEqual(1);
  });

  test('@accessibility history section has an aria-label', async ({ pageWithHistory }) => {
    await expect(pageWithHistory.historySection).toHaveAttribute('aria-label', /history/i);
  });
});

test.describe('Keyboard Navigation', () => {
  test('@accessibility mood buttons are keyboard activatable via Enter', async ({
    bridgePage,
    page,
  }) => {
    const btn = page.getByTestId('mood-button-anxious');
    await btn.focus();
    await btn.press('Enter');
    await expect(bridgePage.taskCard).toBeVisible();
  });

  test('@accessibility mood buttons are keyboard activatable via Space', async ({
    bridgePage,
    page,
  }) => {
    const btn = page.getByTestId('mood-button-stuck');
    await btn.focus();
    await btn.press('Space');
    await expect(bridgePage.taskCard).toBeVisible();
  });

  test('@accessibility action buttons are reachable via Tab from the task card', async ({
    bridgePage,
    page,
  }) => {
    await bridgePage.selectMood('overwhelmed');
    // Focus the back button (first focusable element in the card) and Tab through
    await bridgePage.backButton.focus();
    await page.keyboard.press('Tab'); // → Start
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(['start-button', 'complete-button']).toContain(focused);
  });

  test('@accessibility back button is keyboard activatable', async ({ bridgePage, page }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.backButton.focus();
    await page.keyboard.press('Enter');
    await expect(bridgePage.moodSelector).toBeVisible();
  });
});
