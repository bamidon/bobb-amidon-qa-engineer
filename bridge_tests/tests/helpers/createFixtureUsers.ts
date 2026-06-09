/**
 * One-time setup: creates fixture-alice and fixture-bob in Supabase,
 * seeds their history, and prints the credentials to add to .env.
 *
 * Run with: npx tsx tests/helpers/createFixtureUsers.ts
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */
import { createClient } from '@supabase/supabase-js';
import { generateBatch, makeStreak } from './factory';

const url = process.env.SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'Bridge-test-2024!';

async function createOrGet(email: string): Promise<string> {
  // Try to find existing user
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`  exists: ${email} (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create ${email}: ${error?.message}`);
  console.log(`  created: ${email} (${data.user.id})`);
  return data.user.id;
}

async function seedHistory(userId: string, count: number, streak: number) {
  // Clear existing entries
  await admin.from('history_entries').delete().eq('user_id', userId);

  const entries = [...makeStreak(streak), ...generateBatch(count - streak)];
  const rows = entries.map((e) => ({
    id: e.id,
    session_id: userId,
    user_id: userId,
    mood: e.mood,
    task_id: e.task.id,
    task_title: e.task.title,
    action: e.action,
    created_at: e.timestamp,
  }));
  const { error } = await admin.from('history_entries').insert(rows);
  if (error) throw new Error(`seedHistory failed: ${error.message}`);
  console.log(`  seeded ${rows.length} entries`);
}

async function main() {
  console.log('Creating fixture users…');

  console.log('\nfixture-alice (7-day streak, 15 total entries):');
  const aliceId = await createOrGet('fixture-alice@bridge.test');
  await seedHistory(aliceId, 15, 7);

  console.log('\nfixture-bob (3 entries, mixed moods):');
  const bobId = await createOrGet('fixture-bob@bridge.test');
  await seedHistory(bobId, 3, 0);

  console.log('\nAdd to .env:\n');
  console.log(`FIXTURE_ALICE_EMAIL=fixture-alice@bridge.test`);
  console.log(`FIXTURE_ALICE_PASSWORD=${PASSWORD}`);
  console.log(`FIXTURE_BOB_EMAIL=fixture-bob@bridge.test`);
  console.log(`FIXTURE_BOB_PASSWORD=${PASSWORD}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
