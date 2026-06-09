import { useState } from 'react';
import { HistoryEntry } from '../types';

interface HistoryListProps {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dateKey(timestamp: string): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateLabel(timestamp: string): string {
  const d = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dateKey(timestamp) === dateKey(now.toISOString())) return 'Today';
  if (dateKey(timestamp) === dateKey(yesterday.toISOString())) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface Group {
  key: string;
  label: string;
  entries: HistoryEntry[];
}

function groupByDate(entries: HistoryEntry[]): Group[] {
  const groups: Group[] = [];
  for (const entry of entries) {
    const key = dateKey(entry.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({ key, label: dateLabel(entry.timestamp), entries: [entry] });
    }
  }
  return groups;
}

export function HistoryList({ entries, onDelete, onUpdateNote }: HistoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  function startEdit(entry: HistoryEntry) {
    setEditingId(entry.id);
    setDraft(entry.note ?? '');
  }

  function saveNote(id: string) {
    onUpdateNote(id, draft.trim());
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft('');
  }

  const groups = groupByDate(entries);

  return (
    <section className="history-section" data-testid="history-section" aria-label="Task history">
      <h2 className="history-title">History</h2>
      <div data-testid="history-list">
        {groups.map((group) => (
          <div key={group.key} className="history-date-group">
            <div className="history-date-label" role="separator">{group.label}</div>
            <ul className="history-list">
              {group.entries.map((entry) => {
                const isEditing = editingId === entry.id;
                return (
                  <li key={entry.id} className="history-entry" data-testid="history-entry">
                    <div className="history-entry-row">
                      <div className="history-entry-content">
                        <span className="history-task-title">{entry.task.title}</span>
                        <span className="history-mood">while {entry.mood}</span>
                      </div>
                      <div className="history-entry-meta">
                        <span
                          className={`history-badge history-badge-${entry.action}`}
                          data-testid={`history-badge-${entry.action}`}
                        >
                          {entry.action}
                        </span>
                        <time className="history-time" dateTime={entry.timestamp}>
                          {formatTime(entry.timestamp)}
                        </time>
                        <button
                          className={`history-note-btn${entry.note ? ' has-note' : ''}`}
                          onClick={() => (isEditing ? cancelEdit() : startEdit(entry))}
                          aria-label={entry.note ? `Edit note for "${entry.task.title}"` : `Add note for "${entry.task.title}"`}
                          data-testid="history-note-btn"
                          aria-pressed={isEditing}
                        >
                          ✎
                        </button>
                        <button
                          className="history-delete"
                          onClick={() => onDelete(entry.id)}
                          aria-label={`Delete "${entry.task.title}" from history`}
                          data-testid="history-delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {!isEditing && entry.note && (
                      <p className="history-note-text" data-testid="history-note-text">
                        {entry.note}
                      </p>
                    )}

                    {isEditing && (
                      <div className="history-note-editor">
                        <textarea
                          className="history-note-textarea"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Add a reflection…"
                          rows={2}
                          autoFocus
                          data-testid="history-note-textarea"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote(entry.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <div className="history-note-actions">
                          <button
                            className="btn-note-save"
                            onClick={() => saveNote(entry.id)}
                            data-testid="history-note-save"
                          >
                            Save
                          </button>
                          <button
                            className="btn-note-cancel"
                            onClick={cancelEdit}
                            data-testid="history-note-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
