import { supabase } from './supabase';
import { HistoryEntry, Mood } from '../types';
import { TASKS } from '../data/tasks';

interface DbRow {
  id: string;
  session_id: string;
  user_id?: string;
  mood: string;
  task_id: string;
  task_title: string;
  action: string;
  created_at: string;
  note?: string;
}

export async function saveEntry(entry: HistoryEntry, sessionId: string, userId?: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('history_entries').insert({
    id: entry.id,
    session_id: sessionId,
    user_id: userId ?? null,
    mood: entry.mood,
    task_id: entry.task.id,
    task_title: entry.task.title,
    action: entry.action,
    created_at: entry.timestamp,
  });
  if (error) throw error;
}

export async function loadHistory(sessionId: string): Promise<HistoryEntry[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('history_entries')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error || !data) return null;

  const allTasks = Object.values(TASKS).flat();

  return (data as DbRow[]).map((row) => {
    const task = allTasks.find((t) => t.id === row.task_id) ?? {
      id: row.task_id,
      mood: row.mood as Mood,
      title: row.task_title,
      description: '',
      duration: 90,
    };
    return {
      id: row.id,
      mood: row.mood as Mood,
      task,
      action: row.action as 'completed' | 'skipped',
      timestamp: row.created_at,
      note: row.note ?? undefined,
    };
  });
}

export async function updateEntryNote(id: string, note: string): Promise<void> {
  if (!supabase) return;
  // Requires a `note` column in history_entries — no-op if column doesn't exist yet
  const { error } = await supabase.from('history_entries').update({ note }).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('history_entries').delete().eq('id', id);
  if (error) throw error;
}

/** Merge local and remote histories, deduplicate by id, sort newest first. */
export function mergeHistories(
  local: HistoryEntry[],
  remote: HistoryEntry[]
): HistoryEntry[] {
  const map = new Map<string, HistoryEntry>();
  for (const e of remote) map.set(e.id, e);
  for (const e of local) map.set(e.id, e); // local wins on conflict
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
