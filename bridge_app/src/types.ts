export type Mood = 'anxious' | 'stuck' | 'overwhelmed' | 'low-energy' | 'avoidant';

export type TaskStatus = 'idle' | 'started';

export interface Task {
  id: string;
  mood: Mood;
  title: string;
  description: string;
  duration: number;
}

export interface HistoryEntry {
  id: string;
  task: Task;
  mood: Mood;
  action: 'completed' | 'skipped';
  timestamp: string;
  note?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface Insights {
  total: number;
  completionRate: number; // 0–1
  mostUsedMood: Mood | null;
  streak: number; // consecutive calendar days
}
