import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Download, FileText, Plus, Upload } from 'lucide-react';
import type { LegalCase, LegalDocument } from '../../types';
import { api } from '../../lib/api';

type StoredDocument = {
  id: string; case_id: string; original_filename: string; content_type: string; size_bytes: number;
  category: string | null; description: string | null; client_visible: boolean; extraction_status: string; created_at: string;
};

export function DocumentsPage({ cases, role }: { cases: LegalCase[]; role: 'client' | 'lawyer'; onPreviewDocument: (doc: LegalDocument) => void }) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('Evidence');
  const [clientVisible, setClientVisible] = useState(role === 'client');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => Promise.all(cases.map(item => api<StoredDocument[]>(`/cases/${item.id}/documents`)))
    .then(groups => setDocuments(groups.flat())).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load documents.')), [cases]);
  useEffect(() => { void load(); }, [load]);

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !caseId) return;
    setBusy(true); setError('');
    const form = new FormData();
    form.append('file', file); form.append('category', category); form.append('client_visible', String(clientVisible));
    try {
      await api(`/cases/${caseId}/documents`, { method: 'POST', body: form });
      setFile(null); setShowUpload(false); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Upload failed.'); }
    finally { setBusy(false); }
  };

  return <div className="documents-page">
    <div className="page-header-flex"><div><h1>Documents</h1><p className="text-muted">Private case files are available only to authorized case members.</p></div><button className="btn btn-primary" onClick={() => setShowUpload(value => !value)}><Plus size={17} /> Upload document</button></div>
    {error && <div className="auth-error" role="alert">{error}</div>}
    {showUpload && <form className="admin-card admin-provision-form" onSubmit={upload}>
      <label>Case<select required value={caseId} onChange={event => setCaseId(event.target.value)}><option value="">Select case</option>{cases.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>PDF or DOCX<input required type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => setFile(event.target.files?.[0] || null)} /></label>
      <label>Category<input value={category} maxLength={100} onChange={event => setCategory(event.target.value)} /></label>
      {role === 'lawyer' && <label className="toggle-label"><input type="checkbox" checked={clientVisible} onChange={event => setClientVisible(event.target.checked)} /> Share with linked client</label>}
      <button className="btn btn-primary" disabled={busy || !file || !caseId}><Upload size={16} /> {busy ? 'Uploading…' : 'Upload securely'}</button>
    </form>}
    <section className="admin-card"><div className="admin-card-title"><div><h2>Case documents</h2><p>{documents.length} accessible file{documents.length === 1 ? '' : 's'}</p></div></div>
      <div className="admin-user-list">{documents.map(document => <div className="admin-user-row" key={document.id}><div className="admin-user-avatar"><FileText size={18} /></div><div className="admin-user-copy"><strong>{document.original_filename}</strong><span>{document.category || 'Uncategorized'} · {(document.size_bytes / 1024).toFixed(1)} KB · extraction {document.extraction_status}</span></div><span className={`admin-status ${document.client_visible ? 'status-active' : 'status-pending'}`}>{document.client_visible ? 'Shared' : 'Private'}</span><a className="admin-status-toggle" href={`/api/v1/documents/${document.id}/download`}><Download size={15} /> Download</a></div>)}{documents.length === 0 && <p className="admin-empty">No documents have been uploaded.</p>}</div>
    </section>
  </div>;
}
