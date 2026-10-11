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
import { ClientsPage } from './components/clients/ClientsPage';

import { DocumentPreviewModal } from './components/documents/DocumentPreviewModal';
import type { LegalCase, LegalDocument, Lawyer } from './types';
import { AuthPage } from './components/auth/AuthPage';
import type { AuthUser } from './types';
import { ArrowRight, Scale, ShieldCheck } from 'lucide-react';
import { api, authUser as mapAuthUser, legalCase, lawyer } from './lib/api';
import { useLocation, useNavigate } from 'react-router-dom';

function ChangePasswordPage({ onChanged }: { onChanged: (user: AuthUser) => void }) {
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const result = await api<{ user: Parameters<typeof mapAuthUser>[0] }>('/auth/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); onChanged(mapAuthUser(result.user)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update the password.'); } finally { setSaving(false); } };
  return <main className="auth-shell"><aside className="auth-story"><div className="auth-brand"><span className="auth-brand-mark"><Scale size={22} /></span><span>LegalIt</span></div><div className="auth-story-copy"><span className="auth-eyebrow"><ShieldCheck size={14} /> Secure account setup</span><h1>One more step<br /><em>to get started.</em></h1><p>Your administrator issued a temporary password. Set a new personal password before continuing.</p></div><div className="auth-story-footer">Protect your account. Keep your password private.</div></aside><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-heading"><span className="auth-kicker">PASSWORD UPDATE REQUIRED</span><h2>Choose a new password</h2><p>Use at least 12 characters that you have not used elsewhere.</p></div><form className="auth-form" onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 12 characters" /></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="auth-submit" disabled={saving}>{saving ? 'Saving…' : 'Save new password'} <ArrowRight size={17} /></button></form></div></section></main>;
}

function AdminWorkspaceLegacy({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [audit, setAudit] = useState<{ id: string; action: string; createdAt: string; actorUserId: string }[]>([]);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ fullName: '', email: '', role: 'client' as 'client' | 'lawyer' });
  const [issuedCredentials, setIssuedCredentials] = useState<{ userId: string; temporaryPassword: string } | null>(null);
  const load = () => fetch('/api/admin/overview', { credentials: 'include' }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load admin data.'); setUsers(body.users); setAudit(body.audit); }).catch(reason => setError(reason instanceof Error ? reason.message : 'Admin API unavailable.'));
  useEffect(() => { void load(); }, []);
  const provision = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setIssuedCredentials(null); try { const response = await fetch('/api/admin/users', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not create account.'); setIssuedCredentials({ userId: body.user.userId, temporaryPassword: body.temporaryPassword }); setNewUser({ fullName: '', email: '', role: 'client' }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create account.'); } };
  const setStatus = async (target: AuthUser, status: 'active' | 'suspended') => { setError(''); try { const response = await fetch(`/api/admin/users/${encodeURIComponent(target.id)}/status`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not update account.'); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update account.'); } };
  return <div className="admin-shell"><header className="admin-top"><div className="auth-brand"><span className="auth-brand-mark"><Scale size={20} /></span><span>LegalIt <small>CONTROL CENTER</small></span></div><div className="admin-identity"><span>{user.fullName} · Super admin</span><button className="admin-logout" onClick={onSignOut}>Sign out</button></div></header><main className="admin-main"><div className="admin-welcome"><div><span className="auth-kicker">PLATFORM ADMINISTRATION</span><h1>Control center</h1><p>Manage accounts, access, and platform activity.</p></div><div className="admin-secure"><ShieldCheck size={17} /> Audited admin session</div></div>{error && <div className="auth-error" role="alert">{error}</div>}<section className="admin-stats"><div><span>Total accounts</span><strong>{users.length}</strong></div><div><span>Clients</span><strong>{users.filter(item => item.role === 'client').length}</strong></div><div><span>Legal professionals</span><strong>{users.filter(item => item.role === 'lawyer').length}</strong></div><div><span>Suspended</span><strong>{users.filter(item => item.status === 'suspended').length}</strong></div></section><div className="admin-grid"><section className="admin-card"><div className="admin-card-title"><div><h2>Issue an account</h2><p>Create a client or professional login.</p></div></div><form className="admin-provision-form" onSubmit={provision}><label>Full name<input value={newUser.fullName} required minLength={2} onChange={event => setNewUser({ ...newUser, fullName: event.target.value })} placeholder="Full name" /></label><label>Email address<input type="email" value={newUser.email} required onChange={event => setNewUser({ ...newUser, email: event.target.value })} placeholder="person@example.com" /></label><label>Account type<select value={newUser.role} onChange={event => setNewUser({ ...newUser, role: event.target.value as 'client' | 'lawyer' })}><option value="client">Client</option><option value="lawyer">Legal professional</option></select></label><button className="auth-submit" type="submit">Generate login credentials <ArrowRight size={16} /></button></form>{issuedCredentials && <div className="issued-credentials"><strong>Account created. Share these securely once:</strong><span>User ID: <code>{issuedCredentials.userId}</code></span><span>Temporary password: <code>{issuedCredentials.temporaryPassword}</code></span><small>Ask the user to change this password after signing in.</small></div>}</section><section className="admin-card"><div className="admin-card-title"><div><h2>Account access</h2><p>Review accounts and control access.</p></div></div><div className="admin-user-list">{users.map(account => <div className="admin-user-row" key={account.id}><div className="admin-user-avatar">{account.fullName.slice(0, 1).toUpperCase()}</div><div className="admin-user-copy"><strong>{account.fullName}</strong><span>{account.userId} · {account.email}</span></div><span className={`admin-role role-${account.role}`}>{account.role}</span><span className={`admin-status status-${account.status}`}>{account.status}</span>{account.role !== 'admin' && <button className="admin-status-toggle" onClick={() => void setStatus(account, account.status === 'active' ? 'suspended' : 'active')}>{account.status === 'pending' ? 'Approve' : account.status === 'suspended' ? 'Restore' : 'Suspend'}</button>}</div>)}{users.length === 0 && <p className="admin-empty">No accounts loaded yet. Start the API server.</p>}</div></section></div><section className="admin-card admin-audit"><div className="admin-card-title"><div><h2>Recent admin activity</h2><p>Account changes are recorded for accountability.</p></div></div><div className="admin-audit-list">{audit.slice(0, 12).map(entry => <div key={entry.id}><span className="audit-dot" /><strong>{entry.action.replaceAll('_', ' ')}</strong><span>{entry.actorUserId}</span><time>{new Date(entry.createdAt).toLocaleString()}</time></div>)}{audit.length === 0 && <p className="admin-empty">No admin activity yet.</p>}</div></section></main></div>;
}

void AdminWorkspaceLegacy;

function AdminWorkspace({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{ userId: string; temporaryPassword: string } | null>(null);
  const [verifications, setVerifications] = useState<{ id: string; lawyer_user_id: string; status: string; submitted_at: string | null }[]>([]);
  const [account, setAccount] = useState({ fullName: '', email: '', role: 'client' as 'client' | 'lawyer' });
  const [matter, setMatter] = useState({ clientUserId: '', lawyerUserId: '', title: '', cnrNumber: '', courtName: '', category: 'Civil Dispute', filingDate: '', opposingParty: '', summary: '' });
  const load = () => Promise.all([
    api<Parameters<typeof mapAuthUser>[0][]>('/admin/users'),
    api<Parameters<typeof legalCase>[0][]>('/cases'),
    api<{ id: string; lawyer_user_id: string; status: string; submitted_at: string | null }[]>('/admin/lawyer-verifications'),
  ]).then(([storedUsers, storedCases, queue]) => { setUsers(storedUsers.map(mapAuthUser)); setCases(storedCases.map(legalCase)); setVerifications(queue); }).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load data.'));
  useEffect(() => { void load(); }, []);
  const createAccount = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setCredentials(null); try { const body = await api<{ user: Parameters<typeof mapAuthUser>[0]; temporary_password: string }>('/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: account.fullName, email: account.email, role: account.role }) }); setCredentials({ userId: body.user.public_id, temporaryPassword: body.temporary_password }); setAccount({ fullName: '', email: '', role: 'client' }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create account.'); } };
  const createMatter = async (event: React.FormEvent) => { event.preventDefault(); setError(''); try { await api('/admin/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_user_id: matter.clientUserId, lawyer_user_id: matter.lawyerUserId, title: matter.title, court_reference: matter.cnrNumber || null, court_name: matter.courtName || null, case_type: matter.category, matter_summary: matter.summary }) }); setMatter({ clientUserId: '', lawyerUserId: '', title: '', cnrNumber: '', courtName: '', category: 'Civil Dispute', filingDate: '', opposingParty: '', summary: '' }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create case.'); } };
  const reviewVerification = async (id: string, decision: 'approved' | 'rejected' | 'changes_requested') => { setError(''); try { await api(`/admin/lawyer-verifications/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not review verification.'); } };
  return <div className="admin-shell"><header className="admin-top"><div className="auth-brand"><span className="auth-brand-mark"><Scale size={20} /></span><span>LegalIt <small>CONTROL CENTER</small></span></div><div className="admin-identity"><span>{user.fullName} · Super admin</span><button className="admin-logout" onClick={onSignOut}>Sign out</button></div></header><main className="admin-main"><div className="admin-welcome"><div><span className="auth-kicker">PLATFORM ADMINISTRATION</span><h1>Control center</h1><p>Create real accounts, review lawyers, and link case records.</p></div><div className="admin-secure"><ShieldCheck size={17} /> Audited admin session</div></div>{error && <div className="auth-error">{error}</div>}<section className="admin-stats"><div><span>Accounts</span><strong>{users.length}</strong></div><div><span>Clients</span><strong>{users.filter(item => item.role === 'client').length}</strong></div><div><span>Legal professionals</span><strong>{users.filter(item => item.role === 'lawyer').length}</strong></div><div><span>Cases</span><strong>{cases.length}</strong></div></section><section className="admin-card"><div className="admin-card-title"><div><h2>Lawyer verification queue</h2><p>Only approved profiles become public.</p></div></div>{verifications.map(item => <div className="admin-user-row" key={item.id}><div className="admin-user-copy"><strong>{users.find(userItem => userItem.id === item.lawyer_user_id)?.fullName || item.lawyer_user_id}</strong><span>Submitted {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : ''}</span></div><button className="admin-status-toggle" onClick={() => void reviewVerification(item.id, 'approved')}>Approve</button><button className="admin-status-toggle" onClick={() => void reviewVerification(item.id, 'changes_requested')}>Request changes</button><button className="admin-status-toggle" onClick={() => void reviewVerification(item.id, 'rejected')}>Reject</button></div>)}{verifications.length === 0 && <p className="admin-empty">No submitted verifications.</p>}</section><div className="admin-grid"><section className="admin-card"><div className="admin-card-title"><div><h2>Create account</h2><p>Issue client or professional credentials.</p></div></div><form className="admin-provision-form" onSubmit={createAccount}><label>Full name<input required minLength={2} value={account.fullName} onChange={event => setAccount({ ...account, fullName: event.target.value })} /></label><label>Email<input required type="email" value={account.email} onChange={event => setAccount({ ...account, email: event.target.value })} /></label><label>Role<select value={account.role} onChange={event => setAccount({ ...account, role: event.target.value as 'client' | 'lawyer' })}><option value="client">Client</option><option value="lawyer">Legal professional</option></select></label><button className="auth-submit">Create account <ArrowRight size={16} /></button></form>{credentials && <div className="issued-credentials"><strong>Save these credentials now:</strong><span>User ID: <code>{credentials.userId}</code></span><span>Temporary password: <code>{credentials.temporaryPassword}</code></span></div>}</section><section className="admin-card"><div className="admin-card-title"><div><h2>Create case</h2><p>Assign a persisted case to both accounts.</p></div></div><form className="admin-provision-form" onSubmit={createMatter}><label>Client<select required value={matter.clientUserId} onChange={event => setMatter({ ...matter, clientUserId: event.target.value })}><option value="">Select client</option>{users.filter(item => item.role === 'client' && item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.userId}</option>)}</select></label><label>Legal professional<select required value={matter.lawyerUserId} onChange={event => setMatter({ ...matter, lawyerUserId: event.target.value })}><option value="">Select professional</option>{users.filter(item => item.role === 'lawyer' && item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.userId}</option>)}</select></label><label>Case title<input required minLength={3} value={matter.title} onChange={event => setMatter({ ...matter, title: event.target.value })} /></label><label>CNR number<input required value={matter.cnrNumber} onChange={event => setMatter({ ...matter, cnrNumber: event.target.value })} /></label><label>Court<input required value={matter.courtName} onChange={event => setMatter({ ...matter, courtName: event.target.value })} /></label><label>Category<select value={matter.category} onChange={event => setMatter({ ...matter, category: event.target.value })}><option>Civil Dispute</option><option>Property &amp; Real Estate</option><option>Consumer Protection</option><option>Employment &amp; Contract</option><option>Family Law</option><option>Intellectual Property</option></select></label><label>Summary<textarea required minLength={3} value={matter.summary} onChange={event => setMatter({ ...matter, summary: event.target.value })} /></label><button className="auth-submit">Create and assign case <ArrowRight size={16} /></button></form></section></div><section className="admin-card"><div className="admin-card-title"><div><h2>Stored cases</h2><p>These records are visible only to their linked accounts.</p></div></div>{cases.map(item => <div className="admin-user-row" key={item.id}><div className="admin-user-copy"><strong>{item.title}</strong><span>{item.cnrNumber} · {item.courtName}</span></div><span className="admin-status status-active">{item.status}</span></div>)}{cases.length === 0 && <p className="admin-empty">No cases stored.</p>}</section></main></div>;
}

function LawyerWorkspace({ user, cases, onSignOut }: { user: AuthUser; cases: LegalCase[]; onSignOut: () => void }) {
  return <div className="admin-shell"><header className="admin-top"><div className="auth-brand"><span className="auth-brand-mark"><Scale size={20} /></span><span>LegalIt <small>LEGAL PROFESSIONAL</small></span></div><div className="admin-identity"><span>{user.fullName} · Professional</span><button className="admin-logout" onClick={onSignOut}>Sign out</button></div></header><main className="admin-main"><div className="admin-welcome"><div><span className="auth-kicker">YOUR PRACTICE WORKSPACE</span><h1>Welcome, {user.fullName.split(' ')[0]}</h1><p>Cases assigned to your account appear below.</p></div><div className="admin-secure"><ShieldCheck size={17} /> Secure account</div></div><section className="admin-card"><div className="admin-card-title"><div><h2>Assigned cases</h2><p>{cases.length} active matter{cases.length === 1 ? '' : 's'}</p></div></div>{cases.map(item => <div className="admin-user-row" key={item.id}><div className="admin-user-copy"><strong>{item.title}</strong><span>{item.cnrNumber} · {item.courtName}</span></div><span className="admin-status status-active">{item.status}</span></div>)}{cases.length === 0 && <p className="admin-empty">No cases are assigned to this account.</p>}</section></main></div>;
}

void LawyerWorkspace;

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetCaseId, setTargetCaseId] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState<string | undefined>(undefined);
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Handle Theme state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const section = location.pathname.split('/')[2];
    if (section) {
      const timer = window.setTimeout(() => setActiveTab(section === 'research' ? 'ai-assistant' : section), 0);
      return () => window.clearTimeout(timer);
    }
  }, [location.pathname]);

  useEffect(() => { api<{ user: Parameters<typeof mapAuthUser>[0] }>('/auth/me').then(result => { const mapped = mapAuthUser(result.user); setAuthUser(mapped); if (window.location.pathname === '/login') navigate(`/${mapped.role}/dashboard`, { replace: true }); }).catch(() => undefined).finally(() => setAuthLoading(false)); }, [navigate]);
  const loadWorkspace = () => Promise.all([
    api<Parameters<typeof legalCase>[0][]>('/cases'),
    api<Parameters<typeof lawyer>[0][]>('/lawyers'),
  ]).then(([storedCases, storedLawyers]) => { setCases(storedCases.map(legalCase)); setLawyers(storedLawyers.map(lawyer)); }).catch(() => { setCases([]); setLawyers([]); });
  useEffect(() => { if (!authUser || authUser.role === 'admin') return; void loadWorkspace(); }, [authUser]);
  const handleSignOut = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => undefined); setCases([]); setLawyers([]); setAuthUser(null); navigate('/login'); };
  if (authLoading) return <div className="auth-loading"><div className="auth-loading-mark"><Scale size={23} /></div><span>LegalIt</span><div className="auth-loading-line" /></div>;
  if (!authUser) return <AuthPage onAuthenticated={(user) => { setAuthUser(user); navigate(`/${user.role}/dashboard`, { replace: true }); }} />;
  if (authUser.role === 'admin') return <AdminWorkspace user={authUser} onSignOut={() => void handleSignOut()} />;
  if (authUser.mustChangePassword) return <ChangePasswordPage onChanged={setAuthUser} />;

  // Navigate between tabs & pass state parameters
  const handleNavigateTab = (tab: string, caseId?: string) => {
    setActiveTab(tab);
    navigate(`/${authUser.role}/${tab === 'ai-assistant' ? 'research' : tab}`);
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
        caseCount={cases.length}
        role={authUser.role as 'client' | 'lawyer'}
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
              userName={authUser.fullName}
              cases={cases}
              role={authUser.role as 'client' | 'lawyer'}
            />
          )}

          {activeTab === 'cases' && (
            <MyCasesPage 
              initialCaseId={targetCaseId}
              onNavigateTab={handleNavigateTab}
              onPreviewDocument={(doc) => setPreviewDoc(doc)}
              cases={cases}
              lawyers={lawyers}
              onCasesChanged={() => void loadWorkspace()}
              role={authUser.role as 'client' | 'lawyer'}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage 
              onPreviewDocument={(doc) => setPreviewDoc(doc)}
              cases={cases}
              role={authUser.role as 'client' | 'lawyer'}
            />
          )}

          {activeTab === 'clients' && authUser.role === 'lawyer' && <ClientsPage />}

          {activeTab === 'hearings' && (
            <HearingsPage cases={cases} role={authUser.role as 'client' | 'lawyer'} />
          )}

          {activeTab === 'lawyer' && (
            <MyLawyerPage lawyer={cases.find(item => item.assignedLawyer)?.assignedLawyer || null} />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantPage 
              initialQuery={aiQuery}
              onNavigateTab={handleNavigateTab}
              userName={authUser.fullName}
            />
          )}

          {activeTab === 'updates' && (
            <LegalUpdatesPage />
          )}

          {activeTab === 'find-help' && (
            <FindHelpPage lawyers={lawyers} role={authUser.role as 'client' | 'lawyer'} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              theme={theme}
              setTheme={setTheme}
              authUser={authUser}
            />
          )}
        </main>
      </div>

      {/* Global Quick Search Overlay Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={handleNavigateTab}
        cases={cases}
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
