/**
 * Core workflow tests — mood selection → task display → actions.
 * Run with: npm run test:regression
 */
import { test, expect } from '../fixtures/personas';
import { TASKS } from '../bridge_app/src/data/tasks';
import { Mood } from '../bridge_app/src/types';

const MOODS: Mood[] = ['anxious', 'stuck', 'overwhelmed', 'low-energy', 'avoidant'];

test.describe('Mood Selection', () => {
  for (const mood of MOODS) {
    test(`@regression "${mood}" shows the correct first task title`, async ({ bridgePage }) => {
      await bridgePage.selectMood(mood);
      const expected = TASKS[mood][0].title;
      await expect(bridgePage.taskTitle).toHaveText(expected);
    });
  }

  test('@regression mood badge reflects the selected mood', async ({ bridgePage }) => {
    await bridgePage.selectMood('overwhelmed');
    await expect(bridgePage.moodBadge).toContainText('Overwhelmed');
  });

  test('@regression back button returns to mood selector', async ({ bridgePage }) => {
    await bridgePage.selectMood('stuck');
    await bridgePage.goBack();
    await bridgePage.waitForMoodSelector();
    await expect(bridgePage.moodSelector).toBeVisible();
    await expect(bridgePage.taskCard).not.toBeVisible();
  });
});

test.describe('Start Button', () => {
  test('@regression Start reveals the countdown timer', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await expect(bridgePage.timerSection).not.toBeVisible();
    await bridgePage.startTask();
    await expect(bridgePage.timerSection).toBeVisible();
  });

  test('@regression timer starts at 1:30 and counts down', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.startTask();
    await expect(bridgePage.timerDisplay).toHaveText('1:30');
    await bridgePage.page.waitForTimeout(1100);
    await expect(bridgePage.timerDisplay).toHaveText('1:29');
  });

  test('@regression Start button disappears after clicking', async ({ bridgePage }) => {
    await bridgePage.selectMood('stuck');
    await bridgePage.startTask();
    await expect(bridgePage.startButton).not.toBeVisible();
  });

  test('@regression Complete and Skip remain available after Start', async ({ bridgePage }) => {
    await bridgePage.selectMood('stuck');
    await bridgePage.startTask();
    await expect(bridgePage.completeButton).toBeVisible();
    await expect(bridgePage.skipButton).toBeVisible();
  });
});

test.describe('Complete Action', () => {
  test('@regression Complete returns the user to the mood selector', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.completeTask();
    await bridgePage.waitForMoodSelector();
    await expect(bridgePage.moodSelector).toBeVisible();
  });

  test('@regression Complete can be triggered without starting the timer', async ({ bridgePage }) => {
    await bridgePage.selectMood('avoidant');
    await bridgePage.completeTask();
    await expect(bridgePage.moodSelector).toBeVisible();
  });
});

test.describe('Skip Action', () => {
  test('@regression Skip shows the next task for the same mood', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    const first = await bridgePage.getTaskTitle();
    await bridgePage.skipTask();
    const second = await bridgePage.getTaskTitle();
    expect(second).not.toBe(first);
  });

  test('@regression Skip keeps the task card visible (does not return to mood selector)', async ({
    bridgePage,
  }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.skipTask();
    await expect(bridgePage.taskCard).toBeVisible();
    await expect(bridgePage.moodSelector).not.toBeVisible();
  });

  test('@regression Skip cycles through all tasks for a mood then wraps', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    const taskCount = TASKS['anxious'].length;
    const seen = new Set<string>();
    seen.add(await bridgePage.getTaskTitle());

    for (let i = 0; i < taskCount - 1; i++) {
      await bridgePage.skipTask();
      seen.add(await bridgePage.getTaskTitle());
    }

    expect(seen.size).toBe(taskCount);

    await bridgePage.skipTask();
    const wrapped = await bridgePage.getTaskTitle();
    expect(wrapped).toBe(TASKS['anxious'][0].title);
  });

  test('@regression timer resets to idle after Skip', async ({ bridgePage }) => {
    await bridgePage.selectMood('anxious');
    await bridgePage.startTask();
    await bridgePage.skipTask();
    await expect(bridgePage.timerSection).not.toBeVisible();
    await expect(bridgePage.startButton).toBeVisible();
  });
});
