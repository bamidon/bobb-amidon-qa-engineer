/**
 * Test data factory — builds HistoryEntry objects dynamically.
 * Use these instead of hardcoded arrays to get realistic, varied data.
 */
import { HistoryEntry, Mood } from '../bridge_app/src/types';
import { TASKS } from '../bridge_app/src/data/tasks';

const ALL_MOODS: Mood[] = ['anxious', 'stuck', 'overwhelmed', 'low-energy', 'avoidant'];

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function pick<T>(arr: T[], index = 0): T {
  return arr[index % arr.length];
}

/** Build a single history entry. All fields have sensible defaults. */
export function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  const mood = overrides.mood ?? pick(ALL_MOODS);
  const task = overrides.task ?? pick(TASKS[mood]);
  const action = overrides.action ?? 'completed';
  const timestamp = overrides.timestamp ?? new Date().toISOString();
  return {
    id: randomId(),
    mood,
    task,
    action,
    timestamp,
    ...overrides,
  };
}

interface BatchOptions {
  moods?: Mood[];
  actions?: Array<'completed' | 'skipped'>;
}

/**
 * Generate N entries spread 5 minutes apart, newest first.
 * Default pattern: 2 completed for every 1 skipped (~66% completion rate).
 */
export function generateBatch(count: number, options: BatchOptions = {}): HistoryEntry[] {
  const { moods = ALL_MOODS, actions } = options;
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const mood = pick(moods, i);
    const action = actions ? pick(actions, i) : i % 3 === 0 ? 'skipped' : 'completed';
    // Oldest entry is count*5 min ago; newest is 5 min ago
    const timestamp = new Date(now - (count - i) * 5 * 60 * 1000).toISOString();
    return makeEntry({ mood, action, timestamp });
  }).reverse(); // newest first
}

/**
 * Generate entries spanning consecutive calendar days ending today.
 * Each day gets one 'completed' entry at 10am — triggers streak metric.
 */
export function makeStreak(days: number): HistoryEntry[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(10, 0, 0, 0);
    return makeEntry({ action: 'completed', timestamp: date.toISOString() });
  }); // newest first (i=0 is today)
}

/** All entries are 'completed' — produces 100% completion rate. */
export function makeHighCompletion(count: number): HistoryEntry[] {
  return generateBatch(count, { actions: ['completed'] });
}

/** All entries are 'skipped' — produces 0% completion rate. */
export function makeHighSkip(count: number): HistoryEntry[] {
  return generateBatch(count, { actions: ['skipped'] });
}

/** All entries for a single mood — makes that mood win mostUsedMood. */
export function makeSingleMoodFocus(mood: Mood, count: number): HistoryEntry[] {
  return generateBatch(count, { moods: [mood] });
}
