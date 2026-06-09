import { useEffect } from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About Bridge"
      data-testid="about-modal"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">About Bridge</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close about dialog"
            data-testid="about-close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <h3>What is micro-activation?</h3>
            <p>
              A micro-activation is a brief, intentional action designed to interrupt a stuck
              emotional state and create a small shift in your nervous system. Unlike big tasks
              that feel overwhelming, micro-activations are achievable in 90 seconds or less —
              just enough to move the needle without adding pressure.
            </p>
          </section>

          <section className="modal-section">
            <h3>Why 90 seconds?</h3>
            <p>
              Neuroscientist Dr. Jill Bolte Taylor found that the physiological lifespan of an
              emotion is approximately 90 seconds. When triggered, a chemical loop runs through
              your body and naturally flushes out in about 90 seconds. What keeps emotions
              going longer is the thoughts that re-trigger them. A focused 90-second action
              can interrupt that loop and create a genuine shift.
            </p>
          </section>

          <section className="modal-section">
            <h3>How to use Bridge</h3>
            <ol className="modal-steps">
              <li>Select the mood that best describes how you feel right now</li>
              <li>Bridge suggests a grounding task matched to that state</li>
              <li>Hit <strong>Start</strong> to begin the 90-second timer, or go at your own pace</li>
              <li>Mark it <strong>Complete</strong> when done, or <strong>Skip</strong> to see a different suggestion for the same mood</li>
              <li>Your history is saved automatically so you can notice patterns over time</li>
            </ol>
          </section>

          <section className="modal-section">
            <h3>About the moods</h3>
            <ul className="modal-moods">
              <li><span className="mood-chip">😰 Anxious</span> Breath-based and sensory grounding tasks to calm the nervous system</li>
              <li><span className="mood-chip">🪨 Stuck</span> Small writing or movement tasks to break inertia</li>
              <li><span className="mood-chip">🌊 Overwhelmed</span> Scope-reducing tasks that restore a sense of control</li>
              <li><span className="mood-chip">🪫 Low Energy</span> Gentle physical and breath tasks to reactivate body and mind</li>
              <li><span className="mood-chip">🙈 Avoidant</span> Tiny commitment tasks that make starting feel safe</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
