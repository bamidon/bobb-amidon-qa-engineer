import { useEffect, useState } from 'react';
import { upgradeAccount, signIn } from '../services/auth';
import type { User } from '../services/auth';

interface AccountModalProps {
  isAnonymous: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AccountModal({ isAnonymous, onClose, onSuccess }: AccountModalProps) {
  const [mode, setMode] = useState<'save' | 'signin'>(isAnonymous ? 'save' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      if (mode === 'save') {
        await upgradeAccount(email, password);
        setDone(true);
      } else {
        const user = await signIn(email, password);
        if (user) onSuccess(user);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  const title = mode === 'save' ? 'Save your account' : 'Sign in';
  const submitLabel = pending ? '…' : mode === 'save' ? 'Save account' : 'Sign in';

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="account-modal"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close account dialog"
            data-testid="account-modal-close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {done ? (
            <div className="account-success">
              <p>Check your email — we sent a confirmation link to <strong>{email}</strong>.</p>
              <p className="account-success-note">Once confirmed, your account is saved and your history will sync across devices.</p>
              <button className="btn-note-save" onClick={onClose} style={{ marginTop: 12 }}>Got it</button>
            </div>
          ) : (
            <>
              {mode === 'save' && (
                <p className="account-intro">Save your history to your account so it syncs across devices.</p>
              )}
              <form className="account-form" onSubmit={handleSubmit} noValidate>
                <label className="account-label" htmlFor="account-email">Email</label>
                <input
                  id="account-email"
                  className="account-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  data-testid="account-email-input"
                />
                <label className="account-label" htmlFor="account-password">Password</label>
                <input
                  id="account-password"
                  className="account-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'save' ? 'new-password' : 'current-password'}
                  placeholder="8+ characters"
                  required
                  data-testid="account-password-input"
                />
                {error && <p className="account-error" role="alert">{error}</p>}
                <button
                  className="account-submit"
                  type="submit"
                  disabled={pending}
                  data-testid="account-submit"
                >
                  {submitLabel}
                </button>
              </form>
              <p className="account-toggle">
                {mode === 'save' ? (
                  <>Already have an account?{' '}
                    <button className="account-toggle-link" onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
                  </>
                ) : (
                  <>New here?{' '}
                    <button className="account-toggle-link" onClick={() => { setMode('save'); setError(''); }}>Create account</button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
