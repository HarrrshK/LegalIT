import { useEffect, useState, type FormEvent } from 'react';
import { Calendar, MapPin, Plus } from 'lucide-react';
import type { LegalCase } from '../../types';
import { api } from '../../lib/api';

type Appointment = { id: string; case_id: string | null; title: string; starts_at: string; ends_at: string | null; location: string | null; client_visible: boolean };

export function HearingsPage({ cases, role }: { cases: LegalCase[]; role: 'client' | 'lawyer' }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ caseId: '', title: '', startsAt: '', endsAt: '', location: '', clientVisible: true });
  const [error, setError] = useState('');
  const load = () => api<Appointment[]>('/appointments').then(setItems).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load appointments.'));
  useEffect(() => { void load(); }, []);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); try { await api(`/cases/${form.caseId}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title, starts_at: new Date(form.startsAt).toISOString(), ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null, location: form.location || null, client_visible: form.clientVisible }) }); setShowForm(false); setForm({ caseId: '', title: '', startsAt: '', endsAt: '', location: '', clientVisible: true }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not schedule appointment.'); } };
  return <div className="hearings-page"><div className="page-header-flex"><div><h1>Hearings and appointments</h1><p className="text-muted">Scheduled case dates visible to your account.</p></div>{role === 'lawyer' && <button className="btn btn-primary" onClick={() => setShowForm(value => !value)}><Plus size={17} /> Schedule</button>}</div>
    {error && <div className="auth-error">{error}</div>}
    {showForm && <form className="admin-card admin-provision-form" onSubmit={submit}><label>Case<select required value={form.caseId} onChange={event => setForm({ ...form, caseId: event.target.value })}><option value="">Select case</option>{cases.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Title<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label>Starts<input required type="datetime-local" value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} /></label><label>Ends<input type="datetime-local" value={form.endsAt} onChange={event => setForm({ ...form, endsAt: event.target.value })} /></label><label>Location<input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} /></label><label className="toggle-label"><input type="checkbox" checked={form.clientVisible} onChange={event => setForm({ ...form, clientVisible: event.target.checked })} /> Visible to client</label><button className="btn btn-primary">Save appointment</button></form>}
    <div className="hearings-stack">{items.map(item => <article className="card" key={item.id} style={{ padding: '1.25rem', marginBottom: '1rem' }}><div className="flex items-center gap-3"><Calendar size={20} /><div><strong>{item.title}</strong><p className="text-muted">{new Date(item.starts_at).toLocaleString()}{item.location ? ` · ${item.location}` : ''}</p></div></div>{item.location && <span className="badge badge-secondary"><MapPin size={13} /> {item.location}</span>}</article>)}{items.length === 0 && <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>No hearings or appointments are scheduled.</div>}</div>
  </div>;
}
