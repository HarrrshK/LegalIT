import { useState } from 'react';
import type { AuthUser } from '../types';
import { api } from '../lib/api';

export function AdminAccountAccess({ users, onChanged }: { users: AuthUser[]; onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = async (user: AuthUser) => {
    setBusy(true); setError('');
    try {
      await api(`/admin/users/${user.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: user.status === 'active' ? 'suspended' : 'active' }) });
      onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not change access.'); }
    finally { setBusy(false); }
  };
  return <section className="admin-card"><div className="admin-card-title"><div><h2>Account access</h2><p>Search accounts and suspend or restore access.</p></div></div><input className="input-field" aria-label="Search accounts" placeholder="Name, email, or user ID" value={search} onChange={event => setSearch(event.target.value)} />{error && <div className="auth-error" role="alert">{error}</div>}<div className="admin-user-list">{users.filter(user => `${user.fullName} ${user.email} ${user.userId}`.toLowerCase().includes(search.toLowerCase())).map(user => <div className="admin-user-row" key={user.id}><div className="admin-user-copy"><strong>{user.fullName}</strong><span>{user.email} · {user.userId}</span></div><span className={`admin-role role-${user.role}`}>{user.role}</span><span className={`admin-status status-${user.status}`}>{user.status}</span>{user.role !== 'admin' && <button className="admin-status-toggle" disabled={busy} onClick={() => void update(user)}>{user.status === 'active' ? 'Suspend' : 'Restore'}</button>}</div>)}</div></section>;
}
