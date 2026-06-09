import { useState, useEffect, useRef } from 'react';
import { Mood, Task, TaskStatus, HistoryEntry, SyncStatus } from './types';
import { TASKS } from './data/tasks';
import { MoodSelector } from './components/MoodSelector';
import { TaskCard } from './components/TaskCard';
import { HistoryList } from './components/HistoryList';
import { InsightsPanel } from './components/InsightsPanel';
import { AboutModal } from './components/AboutModal';
import { AccountModal } from './components/AccountModal';
import { saveEntry, loadHistory, mergeHistories, deleteEntry, updateEntryNote } from './services/history';
import { getSessionId } from './services/session';
import { ensureSession, signOut, onAuthStateChange } from './services/auth';
import type { User } from './services/auth';
import './App.css';

const STORAGE_KEY = 'bridge_history';

function getNextTask(mood: Mood, currentTaskId: string): Task {
  const tasks = TASKS[mood];
  const idx = tasks.findIndex((t) => t.id === currentTaskId);
  return tasks[(idx + 1) % tasks.length];
}

function readLocalHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const INSIGHTS_THRESHOLD = 3;

export default function App() {
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [history, setHistory] = useState<HistoryEntry[]>(readLocalHistory);
  const [showAbout, setShowAbout] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const anonSessionId = useRef(getSessionId());

  // Effective identifier: auth user id when available, localStorage UUID otherwise
  const effectiveId = user?.id ?? anonSessionId.current;

  // Initialize auth session on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChange((u) => setUser(u));
    ensureSession()
      .then((u) => { if (u) setUser(u); })
      .catch(() => {})
      .finally(() => setAuthReady(true));
    return unsubscribe;
  }, []);

  // Load history from Supabase when auth is ready, and again whenever the signed-in user changes
  const userId = user?.id;
  useEffect(() => {
    if (!authReady) return;
    const id = userId ?? anonSessionId.current;
    setSyncStatus('syncing');
    loadHistory(id)
      .then((remote) => {
        if (remote) setHistory((local) => mergeHistories(local, remote));
        setSyncStatus('idle');
      })
      .catch(() => setSyncStatus('error'));
  }, [authReady, userId]);

  // Persist to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Timer
  useEffect(() => {
    if (taskStatus !== 'started') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(90);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [taskStatus]);

  function recordEntry(action: 'completed' | 'skipped') {
    if (!currentTask || !currentMood) return;
    const entry: HistoryEntry = {
      id: randomId(),
      task: currentTask,
      mood: currentMood,
      action,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [entry, ...prev]);
    setSyncStatus('syncing');
    saveEntry(entry, effectiveId, user?.id)
      .then(() => setSyncStatus('idle'))
      .catch(() => setSyncStatus('error'));
  }

  function handleMoodSelect(mood: Mood) {
    setCurrentMood(mood);
    setCurrentTask(TASKS[mood][0]);
    setTaskStatus('idle');
    setTimeLeft(90);
  }

  function handleStart() {
    setTaskStatus('started');
  }

  function handleComplete() {
    recordEntry('completed');
    resetToMoodSelector();
  }

  function handleSkip() {
    if (!currentTask || !currentMood) return;
    recordEntry('skipped');
    const next = getNextTask(currentMood, currentTask.id);
    setCurrentTask(next);
    setTaskStatus('idle');
    setTimeLeft(90);
  }

  function handleDeleteEntry(id: string) {
    setHistory((prev) => prev.filter((e) => e.id !== id));
    deleteEntry(id).catch(() => setSyncStatus('error'));
  }

  function handleUpdateNote(id: string, note: string) {
    setHistory((prev) => prev.map((e) => (e.id === id ? { ...e, note: note || undefined } : e)));
    updateEntryNote(id, note).catch(() => setSyncStatus('error'));
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  function resetToMoodSelector() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentMood(null);
    setCurrentTask(null);
    setTaskStatus('idle');
    setTimeLeft(90);
  }

  const isAnonymous = !user?.email;
  const accountLabel = user?.email
    ? user.email.length > 20 ? user.email.slice(0, 18) + '…' : user.email
    : null;

  return (
    <div className="app" data-testid="app">
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showAccount && (
        <AccountModal
          isAnonymous={isAnonymous}
          onClose={() => setShowAccount(false)}
          onSuccess={(u) => setUser(u)}
        />
      )}

      <header className="app-header">
        <h1 className="app-title">Bridge</h1>
        <p className="app-subtitle">micro-activation planner</p>
        <div className="header-controls">
          {syncStatus === 'syncing' && (
            <span role="status" className="sync-indicator syncing" data-testid="sync-indicator" aria-label="Syncing">
              <span className="sync-dot" aria-hidden="true" />
            </span>
          )}
          {syncStatus === 'error' && (
            <span role="status" className="sync-indicator error" data-testid="sync-indicator" aria-label="Sync error — changes saved locally" title="Sync error — changes saved locally">
              <span className="sync-dot" aria-hidden="true" />
            </span>
          )}

          {accountLabel ? (
            <div className="account-pill" data-testid="account-pill">
              <span className="account-email">{accountLabel}</span>
              <button
                className="account-signout"
                onClick={handleSignOut}
                aria-label="Sign out"
                data-testid="account-signout"
              >
                ↩
              </button>
            </div>
          ) : (
            <button
              className="account-btn"
              onClick={() => setShowAccount(true)}
              aria-label={user ? 'Save account' : 'Sign in or create account'}
              data-testid="account-button"
            >
              ☁
            </button>
          )}

          <button
            className="about-btn"
            onClick={() => setShowAbout(true)}
            aria-label="About Bridge"
            data-testid="about-button"
          >
            ?
          </button>
        </div>
        {import.meta.env.DEV && (
          <a
            className="test-lab-link"
            href="http://localhost:4000"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Test Lab"
          >
            🧪 Test Lab
          </a>
        )}
      </header>

      <main className="app-main">
        {currentMood === null ? (
          <MoodSelector onMoodSelect={handleMoodSelect} />
        ) : (
          <TaskCard
            task={currentTask!}
            mood={currentMood}
            status={taskStatus}
            timeLeft={timeLeft}
            onStart={handleStart}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onBack={resetToMoodSelector}
          />
        )}

        {history.length >= INSIGHTS_THRESHOLD && (
          <InsightsPanel entries={history} />
        )}

        {history.length > 0 && <HistoryList entries={history} onDelete={handleDeleteEntry} onUpdateNote={handleUpdateNote} />}
      </main>
    </div>
  );
}
