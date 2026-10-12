import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, CheckCircle, MapPin, RefreshCw, Search, UserCheck, X } from 'lucide-react';
import type { Lawyer } from '../../types';
import { api } from '../../lib/api';
import './find-help.css';

type Consultation = { id: string; subject: string; issue_description: string; status: string; lawyer_response: string | null; scheduled_at: string | null; created_at: string };
const activeStatuses = ['submitted', 'accepted', 'scheduled'];

export function FindHelpPage({ lawyers, role }: { lawyers: Lawyer[]; role: 'client' | 'lawyer' }) {
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selected, setSelected] = useState<Lawyer | null>(null);
  const [form, setForm] = useState({ subject: '', issue: '' });
  const [requests, setRequests] = useState<Consultation[]>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const load = async () => {
    try { setRequests(await api<Consultation[]>('/consultations')); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load consultations.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let cancelled = false;
    api<Consultation[]>('/consultations')
      .then(items => { if (!cancelled) setRequests(items); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load consultations.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) setSelected(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [busy]);
  const filtered = lawyers.filter(item => (!verifiedOnly || item.verified) && [item.name, item.location, item.specializations.join(' '), item.courtPractice.join(' ')].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const mutate = async (path: string, method: string, body?: object) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api(path, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      setSelected(null); setNotice('Consultation updated successfully.'); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update consultation.'); }
    finally { setBusy(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return;
    await mutate('/consultations', 'POST', { lawyer_user_id: selected.id, subject: form.subject.trim(), issue_description: form.issue.trim() });
  };
  return <div className="directory-workspace">
    <header className="page-header"><div><span className="directory-eyebrow">{role === 'client' ? 'YOUR NEXT STEP' : 'YOUR PRACTICE'}</span><h1>{role === 'client' ? 'Find your legal professional' : 'Consultations'}</h1><p> {role === 'client' ? 'Explore registered professionals and start a conversation about your matter.' : 'Review new requests, respond to clients, and arrange a consultation.'}</p></div><button className="btn btn-secondary" disabled={loading || busy} onClick={() => { setError(''); setLoading(true); void load(); }}><RefreshCw size={16} /> Refresh requests</button></header>
    {error && <div className="auth-error" role="alert">{error}</div>}
    {notice && <div className="admin-secure" role="status"><CheckCircle size={16} />{notice}</div>}
    <div className="consultation-metrics">{[['Open requests', requests.filter(item => activeStatuses.includes(item.status)).length], ['Scheduled', requests.filter(item => item.status === 'scheduled').length], ['Total requests', requests.length]].map(([label, count]) => <div className="card" key={label}><span>{label}</span><strong>{loading ? '…' : count}</strong></div>)}</div>
    {role === 'client' && <section aria-label="Legal professional directory">
      <div className="directory-toolbar"><label className="directory-search"><Search size={18} /><input className="input-field" aria-label="Search professionals" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, city, practice area, or language" /></label><label className="directory-checkbox"><input type="checkbox" checked={verifiedOnly} onChange={event => setVerifiedOnly(event.target.checked)} /> Verified only</label><span className="text-muted">{filtered.length} professionals</span></div>
      <div className="directory-grid">{filtered.map(item => <article className="card professional-card" key={item.id}>
        <div className="professional-heading"><div className="professional-avatar">{item.name.slice(0, 1).toUpperCase()}</div><div><h3>{item.name}</h3><span className={`verification-label ${item.verified ? 'is-verified' : ''}`}><UserCheck size={14} />{item.verified ? 'Administrator verified' : 'Verification pending'}</span></div></div>
        <p className="professional-location"><MapPin size={15} />{item.location}</p>
        <p>{item.bio || 'This professional has not added a biography yet.'}</p>
        <div className="professional-tags">{item.specializations.map(area => <span className="badge badge-primary" key={area}>{area}</span>)}</div>
        <p className="text-xs text-muted">Languages: {item.courtPractice.join(', ') || 'Not stated'}</p>
        <button className="btn btn-primary" disabled={item.acceptingConsultations === false || busy} onClick={() => { setForm({ subject: '', issue: '' }); setSelected(item); setError(''); }}>{item.acceptingConsultations === false ? 'Not accepting requests' : 'Request consultation'}</button>
      </article>)}</div>
      {filtered.length === 0 && <div className="card directory-empty"><Search size={28} /><h3>No matching professionals</h3><p>Try another name or location, or clear the verification filter.</p><button className="btn btn-secondary" onClick={() => { setSearch(''); setVerifiedOnly(false); }}>Clear filters</button></div>}
    </section>}
    <section className="consultation-section"><div className="directory-toolbar"><h2>{role === 'client' ? 'Your consultations' : 'Incoming requests'}</h2><label>Status <select className="input-field" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All requests</option>{['submitted', 'accepted', 'scheduled', 'declined', 'completed', 'cancelled'].map(status => <option key={status} value={status}>{status}</option>)}</select></label></div>
      {loading && <p role="status">Loading consultations…</p>}
      {requests.filter(item => filter === 'all' || item.status === filter).map(item => <article className="card consultation-card" key={item.id}>
        <div className="directory-toolbar"><div><h3>{item.subject}</h3><time className="text-xs text-muted">Requested {new Date(item.created_at).toLocaleDateString()}</time></div><span className="badge badge-primary">{item.status.replaceAll('_', ' ')}</span></div>
        <p className="consultation-description">{item.issue_description}</p>
        {item.lawyer_response && <blockquote>{item.lawyer_response}</blockquote>}
        {item.scheduled_at && <p className="professional-location"><CalendarDays size={16} />{new Date(item.scheduled_at).toLocaleString()}</p>}
        {role === 'lawyer' && item.status === 'submitted' && <div className="consultation-response"><label>Response to client<textarea className="input-field" maxLength={4000} value={response[item.id] || ''} onChange={event => setResponse({ ...response, [item.id]: event.target.value })} placeholder="Explain the next steps or why you cannot take this request." /></label><label>Appointment time (optional)<input className="input-field" type="datetime-local" value={dates[item.id] || ''} onChange={event => setDates({ ...dates, [item.id]: event.target.value })} /></label><div className="consultation-actions">{['accepted', 'declined'].map(decision => <button key={decision} className={`btn ${decision === 'accepted' ? 'btn-primary' : 'btn-secondary'}`} disabled={busy} onClick={() => void mutate(`/consultations/${item.id}/decision`, 'PATCH', { decision, response: response[item.id] || null, scheduled_at: decision === 'accepted' && dates[item.id] ? new Date(dates[item.id]).toISOString() : null })}>{decision === 'accepted' ? 'Accept request' : 'Decline'}</button>)}</div></div>}
        {role === 'lawyer' && ['accepted', 'scheduled'].includes(item.status) && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void mutate(`/consultations/${item.id}/complete`, 'PATCH')}>Mark completed</button>}
        {activeStatuses.includes(item.status) && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => { if (window.confirm('Cancel this consultation request?')) void mutate(`/consultations/${item.id}/cancel`, 'PATCH'); }}>Cancel request</button>}
      </article>)}
      {!loading && requests.filter(item => filter === 'all' || item.status === filter).length === 0 && <div className="card directory-empty"><CalendarDays size={28} /><h3>No consultations here yet</h3><p>{role === 'client' ? 'Choose a professional above to send your first request.' : 'New client requests will appear here for your review.'}</p></div>}
    </section>
    {selected && <div className="modal-overlay"><section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="consultation-title"><div className="modal-header"><div><h3 id="consultation-title">Request consultation</h3><p>with {selected.name}</p></div><button className="btn-icon" aria-label="Close consultation form" disabled={busy} onClick={() => setSelected(null)}><X size={20} /></button></div><form className="modal-body form-stack" onSubmit={submit}><label className="input-group">Subject<input autoFocus className="input-field" required minLength={3} maxLength={240} value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} /></label><label className="input-group">Describe your issue<textarea className="input-field" rows={6} required minLength={20} maxLength={10000} value={form.issue} onChange={event => setForm({ ...form, issue: event.target.value })} /></label><p className="text-xs text-muted">Include key dates and the help you need. Your request is shared with this professional.</p>{error && <div className="auth-error" role="alert">{error}</div>}<button className="btn btn-primary" disabled={busy || form.issue.trim().length < 20 || form.subject.trim().length < 3}><CheckCircle size={16} />{busy ? 'Sending…' : 'Send request'}</button></form></section></div>}
  </div>;
}
