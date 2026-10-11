import { useState, type FormEvent } from 'react';
import { Scale, ShieldCheck, UserRound, BriefcaseBusiness, ArrowRight, Sparkles } from 'lucide-react';
import type { AuthUser, UserRole } from '../../types';
import { api, authUser } from '../../lib/api';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api<{ user: Parameters<typeof authUser>[0] }>(`/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register'
          ? { email, password, full_name: fullName, role }
          : { login: email, password }),
      });
      onAuthenticated(authUser(result.user));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not connect to the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <div className="auth-brand"><span className="auth-brand-mark"><Scale size={22} /></span><span>LegalIt</span></div>
        <div className="auth-story-copy">
          <span className="auth-eyebrow"><Sparkles size={14} /> A clearer way to manage legal work</span>
          <h1>Your legal matters,<br /><em>in good hands.</em></h1>
          <p>One secure space for case updates, documents, your legal team, and practical guidance when you need it.</p>
          <div className="auth-trust"><ShieldCheck size={17} /><span>Private, role-based access for clients and legal professionals</span></div>
        </div>
        <div className="auth-story-footer">A calmer way through complex matters.</div>
      </aside>

      <section className="auth-panel">
        <div className="auth-mobile-brand"><Scale size={20} /> LegalIt</div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="auth-kicker">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span>
            <h2>{mode === 'login' ? 'Sign in to your portal' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Enter your details to continue securely.' : 'Join LegalIt and keep your legal work in one place.'}</p>
          </div>

          <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
            <button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
            <button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
          </div>

          {mode === 'register' && <div className="auth-role-choice" aria-label="Account type">
            <button type="button" className={role === 'client' ? 'selected' : ''} onClick={() => setRole('client')}><UserRound size={17} /><span>Client</span></button>
            <button type="button" className={role === 'lawyer' ? 'selected' : ''} onClick={() => setRole('lawyer')}><BriefcaseBusiness size={17} /><span>Legal professional</span></button>
          </div>}

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && <label>Full name<input autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Your name" required minLength={2} /></label>}
            <label>{mode === 'login' ? 'Email address or user ID' : 'Email address'}<input type={mode === 'login' ? 'text' : 'email'} inputMode="email" autoComplete={mode === 'login' ? 'username' : 'email'} value={email} onChange={event => setEmail(event.target.value)} placeholder={mode === 'login' ? 'you@example.com or CLT-…' : 'you@example.com'} required /></label>
            <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 12 characters'} required minLength={mode === 'login' ? 1 : 12} /></label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create account'} {!busy && <ArrowRight size={17} />}</button>
          </form>
          <p className="auth-legal-note">By continuing, you agree to use this portal responsibly and protect the confidentiality of legal information.</p>
        </div>
        <footer className="auth-panel-footer">© 2026 LegalIt <span>•</span> Secure legal workspace</footer>
      </section>
    </main>
  );
}
