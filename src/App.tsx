import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { QuickSearchModal } from './components/layout/QuickSearchModal';

import { DashboardHome } from './components/dashboard/DashboardHome';
import { MyCasesPage } from './components/cases/MyCasesPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { HearingsPage } from './components/hearings/HearingsPage';
import { MyLawyerPage } from './components/lawyer/MyLawyerPage';
import { AIAssistantPage } from './components/ai/AIAssistantPage';
import { LegalUpdatesPage } from './components/updates/LegalUpdatesPage';
import { FindHelpPage } from './components/find-help/FindHelpPage';
import { SettingsPage } from './components/settings/SettingsPage';

import { DocumentPreviewModal } from './components/documents/DocumentPreviewModal';
import type { LegalDocument } from './types';
import { AuthPage } from './components/auth/AuthPage';
import type { AuthUser } from './types';
import { ArrowRight, BriefcaseBusiness, Scale, ShieldCheck } from 'lucide-react';

function ChangePasswordPage({ onChanged }: { onChanged: (user: AuthUser) => void }) {
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/auth/password', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not update the password.'); onChanged(result.user as AuthUser); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update the password.'); } finally { setSaving(false); } };
  return <main className="auth-shell"><aside className="auth-story"><div className="auth-brand"><span className="auth-brand-mark"><Scale size={22} /></span><span>NyayaFlow</span></div><div className="auth-story-copy"><span className="auth-eyebrow"><ShieldCheck size={14} /> Secure account setup</span><h1>One more step<br /><em>to get started.</em></h1><p>Your administrator issued a temporary password. Set a new personal password before continuing.</p></div><div className="auth-story-footer">Protect your account. Keep your password private.</div></aside><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-heading"><span className="auth-kicker">PASSWORD UPDATE REQUIRED</span><h2>Choose a new password</h2><p>Use at least 12 characters that you have not used elsewhere.</p></div><form className="auth-form" onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 12 characters" /></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="auth-submit" disabled={saving}>{saving ? 'Saving…' : 'Save new password'} <ArrowRight size={17} /></button></form></div></section></main>;
}

function AdminWorkspace({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [audit, setAudit] = useState<{ id: string; action: string; createdAt: string; actorUserId: string }[]>([]);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ fullName: '', email: '', role: 'client' as 'client' | 'lawyer' });
  const [issuedCredentials, setIssuedCredentials] = useState<{ userId: string; temporaryPassword: string } | null>(null);
  const load = () => fetch('/api/admin/overview', { credentials: 'include' }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load admin data.'); setUsers(body.users); setAudit(body.audit); }).catch(reason => setError(reason instanceof Error ? reason.message : 'Admin API unavailable.'));
  useEffect(() => { void load(); }, []);
  const provision = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setIssuedCredentials(null); try { const response = await fetch('/api/admin/users', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not create account.'); setIssuedCredentials({ userId: body.user.userId, temporaryPassword: body.temporaryPassword }); setNewUser({ fullName: '', email: '', role: 'client' }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create account.'); } };
  const setStatus = async (target: AuthUser, status: 'active' | 'suspended') => { setError(''); try { const response = await fetch(`/api/admin/users/${encodeURIComponent(target.id)}/status`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not update account.'); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update account.'); } };
  return <div className="admin-shell"><header className="admin-top"><div className="auth-brand"><span className="auth-brand-mark"><Scale size={20} /></span><span>NyayaFlow <small>CONTROL CENTER</small></span></div><div className="admin-identity"><span>{user.fullName} · Super admin</span><button className="admin-logout" onClick={onSignOut}>Sign out</button></div></header><main className="admin-main"><div className="admin-welcome"><div><span className="auth-kicker">PLATFORM ADMINISTRATION</span><h1>Control center</h1><p>Manage accounts, access, and platform activity.</p></div><div className="admin-secure"><ShieldCheck size={17} /> Audited admin session</div></div>{error && <div className="auth-error" role="alert">{error}</div>}<section className="admin-stats"><div><span>Total accounts</span><strong>{users.length}</strong></div><div><span>Clients</span><strong>{users.filter(item => item.role === 'client').length}</strong></div><div><span>Legal professionals</span><strong>{users.filter(item => item.role === 'lawyer').length}</strong></div><div><span>Suspended</span><strong>{users.filter(item => item.status === 'suspended').length}</strong></div></section><div className="admin-grid"><section className="admin-card"><div className="admin-card-title"><div><h2>Issue an account</h2><p>Create a client or professional login.</p></div></div><form className="admin-provision-form" onSubmit={provision}><label>Full name<input value={newUser.fullName} required minLength={2} onChange={event => setNewUser({ ...newUser, fullName: event.target.value })} placeholder="Full name" /></label><label>Email address<input type="email" value={newUser.email} required onChange={event => setNewUser({ ...newUser, email: event.target.value })} placeholder="person@example.com" /></label><label>Account type<select value={newUser.role} onChange={event => setNewUser({ ...newUser, role: event.target.value as 'client' | 'lawyer' })}><option value="client">Client</option><option value="lawyer">Legal professional</option></select></label><button className="auth-submit" type="submit">Generate login credentials <ArrowRight size={16} /></button></form>{issuedCredentials && <div className="issued-credentials"><strong>Account created. Share these securely once:</strong><span>User ID: <code>{issuedCredentials.userId}</code></span><span>Temporary password: <code>{issuedCredentials.temporaryPassword}</code></span><small>Ask the user to change this password after signing in.</small></div>}</section><section className="admin-card"><div className="admin-card-title"><div><h2>Account access</h2><p>Review accounts and control access.</p></div></div><div className="admin-user-list">{users.map(account => <div className="admin-user-row" key={account.id}><div className="admin-user-avatar">{account.fullName.slice(0, 1).toUpperCase()}</div><div className="admin-user-copy"><strong>{account.fullName}</strong><span>{account.userId} · {account.email}</span></div><span className={`admin-role role-${account.role}`}>{account.role}</span><span className={`admin-status status-${account.status}`}>{account.status}</span>{account.role !== 'admin' && <button className="admin-status-toggle" onClick={() => void setStatus(account, account.status === 'active' ? 'suspended' : 'active')}>{account.status === 'pending' ? 'Approve' : account.status === 'suspended' ? 'Restore' : 'Suspend'}</button>}</div>)}{users.length === 0 && <p className="admin-empty">No accounts loaded yet. Start the API server.</p>}</div></section></div><section className="admin-card admin-audit"><div className="admin-card-title"><div><h2>Recent admin activity</h2><p>Account changes are recorded for accountability.</p></div></div><div className="admin-audit-list">{audit.slice(0, 12).map(entry => <div key={entry.id}><span className="audit-dot" /><strong>{entry.action.replaceAll('_', ' ')}</strong><span>{entry.actorUserId}</span><time>{new Date(entry.createdAt).toLocaleString()}</time></div>)}{audit.length === 0 && <p className="admin-empty">No admin activity yet.</p>}</div></section></main></div>;
}

function LawyerWorkspace({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  return <div className="admin-shell"><header className="admin-top"><div className="auth-brand"><span className="auth-brand-mark"><Scale size={20} /></span><span>NyayaFlow <small>LEGAL PROFESSIONAL</small></span></div><div className="admin-identity"><span>{user.fullName} · Professional</span><button className="admin-logout" onClick={onSignOut}>Sign out</button></div></header><main className="admin-main"><div className="admin-welcome"><div><span className="auth-kicker">YOUR PRACTICE WORKSPACE</span><h1>Welcome, {user.fullName.split(' ')[0]}</h1><p>Your legal professional account is ready. Case management tools can be added to this role workspace.</p></div><div className="admin-secure"><ShieldCheck size={17} /> Secure account</div></div><section className="admin-card lawyer-welcome-card"><div className="lawyer-welcome-icon"><BriefcaseBusiness size={24} /></div><div><h2>Professional workspace</h2><p>Your account ID is <strong>{user.userId}</strong>. This account is separate from client access.</p></div></section></main></div>;
}

export function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetCaseId, setTargetCaseId] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState<string | undefined>(undefined);
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Handle Theme state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => { fetch('/api/auth/me', { credentials: 'include' }).then(response => response.ok ? response.json() : null).then(result => { if (result?.user) setAuthUser(result.user as AuthUser); }).catch(() => undefined).finally(() => setAuthLoading(false)); }, []);
  const handleSignOut = async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined); setAuthUser(null); };
  if (authLoading) return <div className="auth-loading"><div className="auth-loading-mark"><Scale size={23} /></div><span>NyayaFlow</span><div className="auth-loading-line" /></div>;
  if (!authUser) return <AuthPage onAuthenticated={setAuthUser} />;
  if (authUser.role === 'admin') return <AdminWorkspace user={authUser} onSignOut={() => void handleSignOut()} />;
  if (authUser.mustChangePassword) return <ChangePasswordPage onChanged={setAuthUser} />;
  if (authUser.role === 'lawyer') return <LawyerWorkspace user={authUser} onSignOut={() => void handleSignOut()} />;

  // Navigate between tabs & pass state parameters
  const handleNavigateTab = (tab: string, caseId?: string) => {
    setActiveTab(tab);
    if (caseId) {
      setTargetCaseId(caseId);
    }
  };

  const handleSendAIQuery = (query: string) => {
    setAiQuery(query);
    setActiveTab('ai-assistant');
  };

  return (
    <div className="app-layout">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header Navbar */}
        <TopNavbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          theme={theme}
          setTheme={setTheme}
          authUser={authUser}
          onSignOut={() => void handleSignOut()}
        />

        {/* Dynamic Page Views */}
        <main className="content-container">
          {activeTab === 'dashboard' && (
            <DashboardHome 
              onNavigateTab={handleNavigateTab}
              onSendAIQuery={handleSendAIQuery}
            />
          )}

          {activeTab === 'cases' && (
            <MyCasesPage 
              initialCaseId={targetCaseId}
              onNavigateTab={handleNavigateTab}
              onPreviewDocument={(doc) => setPreviewDoc(doc)}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage 
              onPreviewDocument={(doc) => setPreviewDoc(doc)}
            />
          )}

          {activeTab === 'hearings' && (
            <HearingsPage />
          )}

          {activeTab === 'lawyer' && (
            <MyLawyerPage />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantPage 
              initialQuery={aiQuery}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'updates' && (
            <LegalUpdatesPage />
          )}

          {activeTab === 'find-help' && (
            <FindHelpPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              theme={theme}
              setTheme={setTheme}
            />
          )}
        </main>
      </div>

      {/* Global Quick Search Overlay Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={handleNavigateTab}
      />

      {/* Document Sheet Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}

export default App;
