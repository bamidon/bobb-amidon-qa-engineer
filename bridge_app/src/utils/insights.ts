import { HistoryEntry, Insights, Mood } from '../types';

export function computeInsights(entries: HistoryEntry[]): Insights {
  if (entries.length === 0) {
    return { total: 0, completionRate: 0, mostUsedMood: null, streak: 0 };
  }

  const total = entries.length;
  const completed = entries.filter((e) => e.action === 'completed').length;
  const completionRate = completed / total;

  // Most used mood
  const moodCounts: Partial<Record<Mood, number>> = {};
  for (const e of entries) {
    moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
  }
  const mostUsedMood = (
    Object.entries(moodCounts).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0]?.[0] ?? null
  ) as Mood | null;

  // Current streak: consecutive calendar days ending today
  const toDay = (ts: string) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const activityDays = new Set(entries.map((e) => toDay(e.timestamp)));
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const today = toDay(new Date().toISOString());

  let streak = 0;
  let check = today;
  while (activityDays.has(check)) {
    streak++;
    check -= ONE_DAY;
  }

  return { total, completionRate, mostUsedMood, streak };
}
