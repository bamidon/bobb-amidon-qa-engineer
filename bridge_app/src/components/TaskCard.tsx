import { Mood, Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  mood: Mood;
  status: TaskStatus;
  timeLeft: number;
  onStart: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const MOOD_LABELS: Record<Mood, string> = {
  anxious:      'Anxious',
  stuck:        'Stuck',
  overwhelmed:  'Overwhelmed',
  'low-energy': 'Low Energy',
  avoidant:     'Avoidant',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function TaskCard({ task, mood, status, timeLeft, onStart, onComplete, onSkip, onBack }: TaskCardProps) {
  const progress = Math.round(((task.duration - timeLeft) / task.duration) * 100);

  return (
    <div className="task-card" data-testid="task-card">
      <div className="task-card-header">
        <button
          className="back-button"
          onClick={onBack}
          data-testid="back-button"
          aria-label="Go back to mood selection"
        >
          ← Back
        </button>
        <span className="mood-badge" data-testid="mood-badge">
          Feeling: {MOOD_LABELS[mood]}
        </span>
      </div>

      <div className="task-content">
        <p className="task-duration" aria-label="Task duration">90 seconds</p>
        <h2 className="task-title" data-testid="task-title">{task.title}</h2>
        <p className="task-description" data-testid="task-description">{task.description}</p>
      </div>

      {status === 'started' && (
        <div className="timer-section" data-testid="timer-section">
          <div
            className="timer-display"
            data-testid="timer-display"
            aria-live="polite"
            aria-label={`${timeLeft} seconds remaining`}
            aria-atomic="true"
          >
            {formatTime(timeLeft)}
          </div>
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={task.duration}
            aria-valuenow={task.duration - timeLeft}
            aria-label="Task progress"
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="task-actions" data-testid="task-actions">
        {status === 'idle' && (
          <button
            className="btn btn-start"
            onClick={onStart}
            data-testid="start-button"
            aria-label="Start the 90-second task timer"
          >
            Start
          </button>
        )}
        <button
          className="btn btn-complete"
          onClick={onComplete}
          data-testid="complete-button"
          aria-label="Mark task as completed"
        >
          Complete
        </button>
        <button
          className="btn btn-skip"
          onClick={onSkip}
          data-testid="skip-button"
          aria-label="Skip this task and see the next suggestion"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
