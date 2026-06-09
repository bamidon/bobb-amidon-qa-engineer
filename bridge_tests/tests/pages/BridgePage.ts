import { Page, Locator } from '@playwright/test';
import { HistoryEntry, Mood } from '../bridge_app/src/types';
import { makeEntry } from '../helpers/factory';

/**
 * Page Object for the Bridge single-page app.
 * All selectors use data-testid so they survive CSS / text refactors.
 */
export class BridgePage {
  // ── Root sections ──────────────────────────────────────────────
  readonly moodSelector: Locator;
  // ── Insights ───────────────────────────────────────────────────
  readonly insightsPanel: Locator;
  readonly streakCount: Locator;
  readonly completionRateValue: Locator;
  readonly completionRateBar: Locator;
  readonly mostUsedMood: Locator;
  readonly syncIndicator: Locator;
  readonly taskCard: Locator;
  readonly historySection: Locator;
  readonly historyList: Locator;
  readonly historyEntries: Locator;

  // ── Task card elements ─────────────────────────────────────────
  readonly taskTitle: Locator;
  readonly taskDescription: Locator;
  readonly timerSection: Locator;
  readonly timerDisplay: Locator;
  readonly startButton: Locator;
  readonly completeButton: Locator;
  readonly skipButton: Locator;
  readonly backButton: Locator;
  readonly moodBadge: Locator;

  constructor(readonly page: Page) {
    this.insightsPanel        = page.getByTestId('insights-panel');
    this.streakCount          = page.getByTestId('streak-count');
    this.completionRateValue  = page.getByTestId('completion-rate-value');
    this.completionRateBar    = page.getByTestId('completion-rate-bar');
    this.mostUsedMood         = page.getByTestId('most-used-mood');
    this.syncIndicator        = page.getByTestId('sync-indicator');

    this.moodSelector   = page.getByTestId('mood-selector');
    this.taskCard       = page.getByTestId('task-card');
    this.historySection = page.getByTestId('history-section');
    this.historyList    = page.getByTestId('history-list');
    this.historyEntries = page.getByTestId('history-entry');

    this.taskTitle       = page.getByTestId('task-title');
    this.taskDescription = page.getByTestId('task-description');
    this.timerSection    = page.getByTestId('timer-section');
    this.timerDisplay    = page.getByTestId('timer-display');
    this.startButton     = page.getByTestId('start-button');
    this.completeButton  = page.getByTestId('complete-button');
    this.skipButton      = page.getByTestId('skip-button');
    this.backButton      = page.getByTestId('back-button');
    this.moodBadge       = page.getByTestId('mood-badge');
  }

  // ── Navigation ─────────────────────────────────────────────────
  async goto() {
    // When BASE_URL is a full URL (e.g. https://stitiousproductions.com/bridge),
    // navigate directly to it — otherwise use root for local dev.
    await this.page.goto(process.env.BASE_URL ?? '/');
  }

  // ── Actions ────────────────────────────────────────────────────
  async selectMood(mood: Mood) {
    await this.page.getByTestId(`mood-button-${mood}`).click();
  }

  async startTask() {
    await this.startButton.click();
  }

  async completeTask() {
    await this.completeButton.click();
  }

  async skipTask() {
    await this.skipButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }

  // ── Queries ────────────────────────────────────────────────────
  async getTaskTitle(): Promise<string> {
    return (await this.taskTitle.textContent()) ?? '';
  }

  async getHistoryCount(): Promise<number> {
    return this.historyEntries.count();
  }

  async getHistoryEntryAt(index: number): Promise<Locator> {
    return this.historyEntries.nth(index);
  }

  async getMostRecentHistoryEntry(): Promise<Locator> {
    return this.getHistoryEntryAt(0);
  }

  async deleteHistoryEntryAt(index: number) {
    const entry = await this.getHistoryEntryAt(index);
    await entry.getByTestId('history-delete').click();
  }

  // ── Wait helpers ───────────────────────────────────────────────
  async waitForMoodSelector() {
    await this.moodSelector.waitFor({ state: 'visible' });
  }

  async waitForTaskCard() {
    await this.taskCard.waitFor({ state: 'visible' });
  }

  // ── localStorage helpers ───────────────────────────────────────
  async clearHistory() {
    await this.page.evaluate(() => localStorage.removeItem('bridge_history'));
    await this.page.reload();
  }

  async seedHistory(entries: HistoryEntry[]) {
    await this.page.evaluate(
      (data) => localStorage.setItem('bridge_history', JSON.stringify(data)),
      entries
    );
    await this.page.reload();
  }

  async readStoredHistory(): Promise<HistoryEntry[]> {
    return this.page.evaluate(
      () => JSON.parse(localStorage.getItem('bridge_history') ?? '[]')
    );
  }

  // ── Auth helpers ───────────────────────────────────────────────

  /** Opens account modal and submits the Save Account form (anonymous → named). */
  async saveAccount(email: string, password: string) {
    await this.page.getByTestId('account-button').click();
    await this.page.getByTestId('account-modal').waitFor({ state: 'visible' });
    await this.page.getByTestId('account-email-input').fill(email);
    await this.page.getByTestId('account-password-input').fill(password);
    await this.page.getByTestId('account-submit').click();
  }

  /** Opens account modal, switches to Sign In mode, and submits credentials. */
  async signInViaModal(email: string, password: string) {
    await this.page.getByTestId('account-button').click();
    await this.page.getByTestId('account-modal').waitFor({ state: 'visible' });
    await this.page.getByText('Sign in').last().click(); // toggle link
    await this.page.getByTestId('account-email-input').fill(email);
    await this.page.getByTestId('account-password-input').fill(password);
    await this.page.getByTestId('account-submit').click();
    // Wait for modal to close (successful sign in)
    await this.page.getByTestId('account-modal').waitFor({ state: 'hidden' });
  }

  /** Clicks sign out from the account pill and waits for anonymous state to restore. */
  async signOut() {
    await this.page.getByTestId('account-signout').click();
    await this.page.getByTestId('account-button').waitFor({ state: 'visible' });
  }

  /** Returns true if the user is in anonymous state (account button visible, not pill). */
  async isAnonymous(): Promise<boolean> {
    return this.page.getByTestId('account-button').isVisible();
  }

  /** Returns the email shown in the account pill, or null if anonymous. */
  async getAccountEmail(): Promise<string | null> {
    const pill = this.page.getByTestId('account-pill');
    if (!(await pill.isVisible())) return null;
    return pill.locator('.account-email').textContent();
  }

  // ── Supabase API mocks ─────────────────────────────────────────

  /** Intercept Supabase REST calls and return mock history entries on GET, 201 on POST. */
  async mockSupabase(entries: HistoryEntry[] = []) {
    const rows = entries.map((e) => ({
      id: e.id,
      session_id: 'test-session',
      mood: e.mood,
      task_id: e.task.id,
      task_title: e.task.title,
      action: e.action,
      created_at: e.timestamp,
    }));

    await this.page.route('**/rest/v1/history_entries**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(rows),
        });
      } else {
        await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
      }
    });
  }

  /** Make all Supabase REST calls fail with a network error. */
  async mockSupabaseError() {
    await this.page.route('**/rest/v1/history_entries**', async (route) => {
      await route.abort('failed');
    });
  }

}
