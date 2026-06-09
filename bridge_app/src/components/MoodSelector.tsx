import { Mood } from '../types';

interface MoodSelectorProps {
  onMoodSelect: (mood: Mood) => void;
}

const MOOD_CONFIG: Record<Mood, { label: string; emoji: string; color: string }> = {
  anxious:     { label: 'Anxious',    emoji: '😰', color: '#f6ad55' },
  stuck:       { label: 'Stuck',      emoji: '🪨', color: '#718096' },
  overwhelmed: { label: 'Overwhelmed',emoji: '🌊', color: '#fc8181' },
  'low-energy':{ label: 'Low Energy', emoji: '🪫', color: '#63b3ed' },
  avoidant:    { label: 'Avoidant',   emoji: '🙈', color: '#4fd1c5' },
};

export function MoodSelector({ onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="mood-selector" data-testid="mood-selector">
      <p className="mood-question">How are you feeling right now?</p>
      <div className="mood-grid" role="group" aria-label="Select your current mood">
        {(Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => {
          const { label, emoji, color } = MOOD_CONFIG[mood];
          return (
            <button
              key={mood}
              className="mood-button"
              data-testid={`mood-button-${mood}`}
              onClick={() => onMoodSelect(mood)}
              style={{ '--mood-color': color } as React.CSSProperties}
              aria-label={`I'm feeling ${label}`}
            >
              <span className="mood-emoji" aria-hidden="true">{emoji}</span>
              <span className="mood-label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
