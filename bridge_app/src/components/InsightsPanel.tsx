import { HistoryEntry, Mood } from '../types';
import { computeInsights } from '../utils/insights';

interface InsightsPanelProps {
  entries: HistoryEntry[];
}

const MOOD_LABELS: Record<Mood, string> = {
  anxious:      '😰 Anxious',
  stuck:        '🪨 Stuck',
  overwhelmed:  '🌊 Overwhelmed',
  'low-energy': '🪫 Low Energy',
  avoidant:     '🙈 Avoidant',
};

export function InsightsPanel({ entries }: InsightsPanelProps) {
  const { total, completionRate, mostUsedMood, streak } = computeInsights(entries);
  const pct = Math.round(completionRate * 100);

  return (
    <section
      className="insights-panel"
      data-testid="insights-panel"
      aria-label="Activity insights"
    >
      <h2 className="insights-title">Insights</h2>
      <div className="insights-grid">

        <div className="insight-item" data-testid="insight-total">
          <span className="insight-value">{total}</span>
          <span className="insight-label">sessions</span>
        </div>

        <div className="insight-item" data-testid="insight-streak">
          <span className="insight-value" data-testid="streak-count">{streak}</span>
          <span className="insight-label">{streak === 1 ? 'day streak' : 'day streak'}</span>
        </div>

        <div className="insight-item insight-wide">
          <div className="completion-header">
            <span className="insight-label">completion rate</span>
            <span className="insight-value" data-testid="completion-rate-value">{pct}%</span>
          </div>
          <div
            className="completion-bar"
            data-testid="completion-rate-bar"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Completion rate: ${pct}%`}
          >
            <div className="completion-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {mostUsedMood && (
          <div className="insight-item insight-wide" data-testid="most-used-mood">
            <span className="insight-label">go-to mood</span>
            <span className="insight-mood-value">{MOOD_LABELS[mostUsedMood]}</span>
          </div>
        )}

      </div>
    </section>
  );
}
