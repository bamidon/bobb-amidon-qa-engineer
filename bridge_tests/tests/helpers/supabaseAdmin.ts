/**
 * Supabase admin client for test user lifecycle management.
 * Uses the service role key — never exposed to the browser.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the test environment.
 */
import { createClient } from '@supabase/supabase-js';
import { HistoryEntry } from '../bridge_app/src/types';
import { TASKS } from '../bridge_app/src/data/tasks';

const url = process.env.SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function getAdmin() {
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for auth tests');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const TEST_PASSWORD = 'Bridge-test-2024!';
const TEST_DOMAIN = 'bridge.test';

/** Short random suffix for readable but unique test emails. */
function shortId(): string {
  return Math.random().toString(36).slice(2, 6);
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * Creates an ephemeral test user.
 * Email format: test-{label}-{shortid}@bridge.test (e.g. test-alice-a3f2@bridge.test)
 */
export async function createTestUser(label: string): Promise<TestUser> {
  const admin = getAdmin();
  const email = `test-${label}-${shortId()}@${TEST_DOMAIN}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createTestUser failed: ${error?.message}`);
  return { id: data.user.id, email, password: TEST_PASSWORD };
}

/** Deletes a test user and cascades their history rows. */
export async function deleteTestUser(userId: string): Promise<void> {
  const admin = getAdmin();
  await admin.from('history_entries').delete().eq('user_id', userId);
  await admin.auth.admin.deleteUser(userId);
}

/** Seeds history entries directly into Supabase as the given user, bypassing RLS. */
export async function seedUserHistory(userId: string, entries: HistoryEntry[]): Promise<void> {
  const admin = getAdmin();
  const allTasks = Object.values(TASKS).flat();
  const rows = entries.map((e) => ({
    id: e.id,
    session_id: userId,
    user_id: userId,
    mood: e.mood,
    task_id: e.task.id,
    task_title: e.task.title,
    action: e.action,
    created_at: e.timestamp,
    note: e.note ?? null,
  }));
  // Resolve any tasks that might not exist in DB
  for (const row of rows) {
    const task = allTasks.find((t) => t.id === row.task_id);
    if (task) row.task_title = task.title;
  }
  const { error } = await admin.from('history_entries').insert(rows);
  if (error) throw new Error(`seedUserHistory failed: ${error.message}`);
}

/**
 * Fixture users — semi-permanent accounts with pre-seeded history.
 * Create once with: npx ts-node tests/helpers/createFixtureUsers.ts
 * Store the resulting IDs and credentials in .env
 */
export interface FixtureUser {
  email: string;
  password: string;
}

export const FIXTURE_USERS: Record<string, FixtureUser> = {
  alice: {
    email: process.env.FIXTURE_ALICE_EMAIL ?? 'fixture-alice@bridge.test',
    password: process.env.FIXTURE_ALICE_PASSWORD ?? TEST_PASSWORD,
  },
  bob: {
    email: process.env.FIXTURE_BOB_EMAIL ?? 'fixture-bob@bridge.test',
    password: process.env.FIXTURE_BOB_PASSWORD ?? TEST_PASSWORD,
  },
};
