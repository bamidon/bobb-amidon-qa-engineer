/**
 * Insights panel tests — computed analytics derived from history.
 */
import { test, expect } from '../fixtures/personas';
import { makeHighCompletion, makeHighSkip, makeSingleMoodFocus, makeStreak } from '../helpers/factory';

test.describe('Insights — Visibility', () => {
  test('@regression panel is hidden when history has fewer than 3 entries', async ({
    bridgePage,
  }) => {
    await expect(bridgePage.insightsPanel).not.toBeVisible();
  });

  test('@regression panel appears once 3 or more entries exist', async ({ pageWithInsights }) => {
    await expect(pageWithInsights.insightsPanel).toBeVisible();
  });

  test('@regression panel is visible with large history', async ({ pageWithLargeHistory }) => {
    await expect(pageWithLargeHistory.insightsPanel).toBeVisible();
  });
});

test.describe('Insights — Completion Rate', () => {
  test('@regression shows 100% when all entries are completed', async ({ bridgePage, page }) => {
    await bridgePage.seedHistory(makeHighCompletion(5));
    await expect(bridgePage.completionRateValue).toHaveText('100%');
  });

  test('@regression shows 0% when all entries are skipped', async ({ bridgePage }) => {
    await bridgePage.seedHistory(makeHighSkip(5));
    await expect(bridgePage.completionRateValue).toHaveText('0%');
  });

  test('@regression completion bar has correct aria-valuenow', async ({ bridgePage }) => {
    await bridgePage.seedHistory(makeHighCompletion(4));
    await expect(bridgePage.completionRateBar).toHaveAttribute('aria-valuenow', '100');
  });

  test('@regression completion bar has correct accessible role and bounds', async ({
    bridgePage,
  }) => {
    await bridgePage.seedHistory(makeHighCompletion(4));
    await expect(bridgePage.completionRateBar).toHaveAttribute('role', 'progressbar');
    await expect(bridgePage.completionRateBar).toHaveAttribute('aria-valuemin', '0');
    await expect(bridgePage.completionRateBar).toHaveAttribute('aria-valuemax', '100');
  });
});

test.describe('Insights — Most Used Mood', () => {
  test('@regression shows the mood with the highest entry count', async ({ bridgePage }) => {
    await bridgePage.seedHistory(makeSingleMoodFocus('anxious', 5));
    await expect(bridgePage.mostUsedMood).toContainText('Anxious');
  });

  test('@regression updates correctly when overwhelmed dominates', async ({ bridgePage }) => {
    await bridgePage.seedHistory(makeSingleMoodFocus('overwhelmed', 4));
    await expect(bridgePage.mostUsedMood).toContainText('Overwhelmed');
  });
});

test.describe('Insights — Streak', () => {
  test('@regression shows correct streak for consecutive days', async ({ pageWithStreak }) => {
    await expect(pageWithStreak.streakCount).toHaveText('7');
  });

  test('@regression streak is 1 when only today has entries', async ({ bridgePage }) => {
    // Need ≥3 entries for the insights panel to render; pad with today's entries
    const todayEntries = [...makeStreak(1), ...makeStreak(1), ...makeStreak(1)];
    await bridgePage.seedHistory(todayEntries);
    await expect(bridgePage.streakCount).toHaveText('1');
  });

  test('@regression streak resets when there is a gap in days', async ({ bridgePage }) => {
    // Entry 2 days ago, then today — gap breaks the streak → streak = 1
    const twoDaysAgo = makeStreak(1).map((e) => ({
      ...e,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    const today = [makeStreak(1)[0], makeStreak(1)[0], makeStreak(1)[0]];
    await bridgePage.seedHistory([...today, ...twoDaysAgo]);
    await expect(bridgePage.streakCount).toHaveText('1');
  });
});
