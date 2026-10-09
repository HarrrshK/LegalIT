import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Scale, 
  Calendar, 
  FileText, 
  UserCheck, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Eye, 
  MessageSquare,
  ChevronRight,
  Plus,
  Sparkles,
  X
} from 'lucide-react';
import type { LegalCase, LegalDocument, Lawyer } from '../../types';

interface MyCasesPageProps {
  initialCaseId?: string;
  onNavigateTab: (tab: string) => void;
  onPreviewDocument: (doc: LegalDocument) => void;
  cases: LegalCase[];
  lawyers: Lawyer[];
  onCasesChanged: () => void;
  role: 'client' | 'lawyer';
}

export const MyCasesPage: React.FC<MyCasesPageProps> = ({
  initialCaseId,
  onNavigateTab,
  onPreviewDocument,
  cases,
  lawyers,
  onCasesChanged,
  role
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialCaseId || null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'timeline' | 'documents' | 'hearings' | 'lawyer'>('overview');
  const [showCreate, setShowCreate] = useState(false);
  const [issue, setIssue] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [decisionBusy, setDecisionBusy] = useState<string | null>(null);
  const [caseForm, setCaseForm] = useState({ title: '', category: 'Civil Dispute', opposingParty: '', courtName: '', summary: '', lawyerUserId: '' });

  const createAiDraft = async () => { setDrafting(true); setFormError(''); try { const response = await fetch('/api/ai/case-intake', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: issue }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not create a draft.'); setCaseForm(current => ({ ...current, ...body.draft })); } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Could not create a draft.'); } finally { setDrafting(false); } };
  const submitCase = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setFormError(''); try { const response = await fetch('/api/cases', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(caseForm) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not create the case.'); setShowCreate(false); setIssue(''); setCaseForm({ title: '', category: 'Civil Dispute', opposingParty: '', courtName: '', summary: '', lawyerUserId: '' }); onCasesChanged(); setSelectedCaseId(body.case.id); } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Could not create the case.'); } finally { setSaving(false); } };
  const decideCase = async (caseId: string, decision: 'accepted' | 'rejected') => { setDecisionBusy(caseId); setFormError(''); try { const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/decision`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not update the case.'); onCasesChanged(); } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Could not update the case.'); } finally { setDecisionBusy(null); } };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cnrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courtName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="cases-page">
      {/* Page Header */}
      {!selectedCase ? (
        <div className="page-header-flex">
          <div>
            <h1>{role === 'lawyer' ? 'Assigned Cases' : 'My Cases'}</h1>
            <p className="text-muted">{role === 'lawyer' ? 'Review client requests and manage accepted matters' : 'Track and manage your active and past legal proceedings'}</p>
          </div>
          {role === 'client' && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={17} /> Create New Case
          </button>}
        </div>
      ) : (
        <div className="case-detail-header">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCaseId(null)}>
            <ArrowLeft size={16} /> Back to All Cases
          </button>
          <div className="header-case-info">
            <span className="badge badge-primary">{selectedCase.category}</span>
            <h2>{selectedCase.title}</h2>
            <span className="cnr-mono">CNR: {selectedCase.cnrNumber}</span>
          </div>
        </div>
      )}

      {/* Case List View */}
      {!selectedCase ? (
        <>
          {/* Controls: Search & Category Pills */}
          <div className="cases-controls">
            <div className="search-box">
              <Search size={18} className="search-box-icon" />
              <input 
                type="text" 
                placeholder="Search by case title, CNR number, or court..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="category-pills">
              {['All', 'Property & Real Estate', 'Employment & Contract', 'Consumer Protection'].map(cat => (
                <button
                  key={cat}
                  className={`pill-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cases Cards List */}
          <div className="cases-grid">
            {filteredCases.map(c => (
              <div key={c.id} className="card case-card">
                <div className="case-card-top">
                  <div className="cat-badge-wrap">
                    <span className="badge badge-primary">{c.category}</span>
                    <span className={`badge ${
                      c.status === 'Active' ? 'badge-active' : 
                      c.status === 'In Hearing' ? 'badge-hearing' : 'badge-reserved'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <h3>{c.title}</h3>
                  <span className="cnr-mono">CNR: {c.cnrNumber}</span>
                </div>

                <p className="case-desc">{c.summary}</p>

                <div className="court-info-box">
                  <div className="info-line">
                    <Scale size={15} /> <strong>Court:</strong> {c.courtName}
                  </div>
                  <div className="info-line">
                    <UserCheck size={15} /> <strong>Counsel:</strong> {c.assignedLawyer.name}
                  </div>
                  {c.nextHearing && (
                    <div className="info-line text-amber">
                      <Calendar size={15} /> <strong>Next Hearing:</strong> {c.nextHearing.date} ({c.nextHearing.time})
                    </div>
                  )}
                </div>

                <div className="card-progress">
                  <div className="progress-label">
                    <span>Progression</span>
                    <span>{c.progressPercent}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${c.progressPercent}%` }} />
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      setActiveDetailTab('overview');
                    }}
                  >
                    View Case File <ChevronRight size={16} />
                  </button>
                  {role === 'lawyer' && c.status === 'Pending Review' && <><button className="btn btn-primary btn-sm flex-1" disabled={decisionBusy === c.id} onClick={() => void decideCase(c.id, 'accepted')}>Accept case</button><button className="btn btn-secondary btn-sm flex-1" disabled={decisionBusy === c.id} onClick={() => void decideCase(c.id, 'rejected')}>Reject</button></>}
                </div>
              </div>
            ))}
            {filteredCases.length === 0 && <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>No cases are linked to your account.</div>}
          </div>
        </>
      ) : (
        /* Detailed View with 5 Sub-Tabs */
        <div className="case-detail-container">
          {/* Sub-Tab Bar */}
          <div className="tabs-nav">
            <button 
              className={`tab-button ${activeDetailTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('overview')}
            >
              <Briefcase size={16} /> Case Overview
            </button>
            <button 
              className={`tab-button ${activeDetailTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('timeline')}
            >
              <Clock size={16} /> Interactive Timeline
            </button>
            <button 
              className={`tab-button ${activeDetailTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('documents')}
            >
              <FileText size={16} /> Documents ({selectedCase.documents.length})
            </button>
            <button 
              className={`tab-button ${activeDetailTab === 'hearings' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('hearings')}
            >
              <Calendar size={16} /> Hearing Logs ({selectedCase.hearings.length})
            </button>
            <button 
              className={`tab-button ${activeDetailTab === 'lawyer' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('lawyer')}
            >
              <UserCheck size={16} /> Lead Counsel
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeDetailTab === 'overview' && (
            <div className="tab-pane overview-pane">
              <div className="grid-2-1">
                <div className="card">
                  <h3>Case Summary & Claims</h3>
                  <p className="summary-paragraph">{selectedCase.summary}</p>

                  <h4 className="mt-4 mb-2">Key Legal Particulars</h4>
                  <div className="particulars-grid">
                    <div className="particular-item">
                      <span className="p-label">Filing Date</span>
                      <span className="p-val">{selectedCase.filingDate}</span>
                    </div>
                    <div className="particular-item">
                      <span className="p-label">Court Name</span>
                      <span className="p-val">{selectedCase.courtName}</span>
                    </div>
                    <div className="particular-item">
                      <span className="p-label">Bench / Courtroom</span>
                      <span className="p-val">{selectedCase.bench}</span>
                    </div>
                    <div className="particular-item">
                      <span className="p-label">Presiding Judge</span>
                      <span className="p-val">{selectedCase.judgeName}</span>
                    </div>
                    <div className="particular-item">
                      <span className="p-label">Opposing Party</span>
                      <span className="p-val">{selectedCase.opposingParty}</span>
                    </div>
                    <div className="particular-item">
                      <span className="p-label">Status</span>
                      <span className="p-val badge badge-active">{selectedCase.status}</span>
                    </div>
                  </div>
                </div>

                <div className="card side-summary-box">
                  <h4>Next Action & Hearing</h4>
                  {selectedCase.nextHearing ? (
                    <div className="next-hearing-box">
                      <div className="nh-date">{selectedCase.nextHearing.date}</div>
                      <div className="nh-time">{selectedCase.nextHearing.time}</div>
                      <div className="nh-stage">Stage: {selectedCase.nextHearing.stage}</div>
                      <p className="nh-purpose">{selectedCase.nextHearing.purpose}</p>
                      <button 
                        className="btn btn-outline btn-sm w-full mt-2"
                        onClick={() => setActiveDetailTab('hearings')}
                      >
                        View Full Hearing Log
                      </button>
                    </div>
                  ) : (
                    <p className="text-muted">No upcoming hearing scheduled yet.</p>
                  )}

                  <div className="counsel-mini-box mt-4">
                    <h4>Assigned Counsel</h4>
                    <div className="counsel-flex">
                      <img src={selectedCase.assignedLawyer.photoUrl} alt="" className="avatar-md" />
                      <div>
                        <div className="c-name">{selectedCase.assignedLawyer.name}</div>
                        <div className="c-title text-xs">{selectedCase.assignedLawyer.title}</div>
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm w-full mt-3"
                      onClick={() => setActiveDetailTab('lawyer')}
                    >
                      Contact Counsel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeDetailTab === 'timeline' && (
            <div className="tab-pane timeline-pane">
              <div className="card">
                <h3>Case Progress Timeline</h3>
                <p className="text-muted mb-4">Chronological breakdown of procedural stages from initial filing to final judgment.</p>

                <div className="timeline-flow">
                  {selectedCase.timeline.map((step) => (
                    <div key={step.id} className={`timeline-item ${step.status}`}>
                      <div className="timeline-marker">
                        {step.status === 'completed' && <CheckCircle2 size={18} color="#059669" />}
                        {step.status === 'current' && <Clock size={18} color="#D97706" />}
                        {step.status === 'upcoming' && <AlertCircle size={18} color="#94A3B8" />}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h4>{step.stage}</h4>
                          <span className="step-date">{step.date}</span>
                        </div>
                        <p className="step-desc">{step.description}</p>
                        {step.benchNotes && (
                          <div className="bench-notes-box">
                            <strong>Bench Note:</strong> {step.benchNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeDetailTab === 'documents' && (
            <div className="tab-pane documents-pane">
              <div className="card">
                <div className="section-header">
                  <h3>Case File Documents</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('documents')}>
                    Open Documents Vault
                  </button>
                </div>

                <div className="docs-table-wrapper">
                  <table className="docs-table">
                    <thead>
                      <tr>
                        <th>Document Title</th>
                        <th>Category</th>
                        <th>File Size</th>
                        <th>Uploaded By</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCase.documents.map(doc => (
                        <tr key={doc.id}>
                          <td>
                            <div className="doc-title-cell">
                              <FileText size={18} className="text-primary" />
                              <div>
                                <div className="doc-name">{doc.title}</div>
                                <div className="doc-file text-xs">{doc.fileName}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-neutral">{doc.category}</span></td>
                          <td>{doc.fileSize}</td>
                          <td>{doc.uploadedBy}</td>
                          <td>{doc.uploadDate}</td>
                          <td>
                            <div className="action-flex">
                              <button 
                                className="btn-icon"
                                title="Preview Document"
                                onClick={() => onPreviewDocument(doc)}
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                className="btn-icon"
                                title="Download Document"
                                onClick={() => alert(`Downloading ${doc.fileName}...`)}
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HEARINGS */}
          {activeDetailTab === 'hearings' && (
            <div className="tab-pane hearings-pane">
              <div className="card">
                <h3>Court Hearing History & Logs</h3>
                <div className="hearings-list mt-3">
                  {selectedCase.hearings.map(h => (
                    <div key={h.id} className="hearing-log-card">
                      <div className="hl-header">
                        <span className={`badge ${h.status === 'Upcoming' ? 'badge-hearing' : 'badge-active'}`}>
                          {h.status}
                        </span>
                        <span className="hl-date">{h.date} at {h.time}</span>
                      </div>
                      <h4>Stage: {h.stage}</h4>
                      <p className="hl-court">{h.courtName} • {h.bench}</p>
                      <p className="hl-purpose">Purpose: {h.purpose}</p>
                      {h.previousOrderSummary && (
                        <div className="order-summary-box">
                          <strong>Court Order Summary:</strong> {h.previousOrderSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LAWYER */}
          {activeDetailTab === 'lawyer' && (
            <div className="tab-pane lawyer-pane">
              <div className="card">
                <div className="lawyer-full-flex">
                  <img src={selectedCase.assignedLawyer.photoUrl} alt="" className="avatar-xl" />
                  <div className="lawyer-full-info">
                    <h3>{selectedCase.assignedLawyer.name}</h3>
                    <p className="text-muted">{selectedCase.assignedLawyer.title}</p>
                    <div className="lawyer-tags mt-2">
                      <span className="badge badge-primary">Bar: {selectedCase.assignedLawyer.barRegistration}</span>
                      <span className="badge badge-neutral">{selectedCase.assignedLawyer.experienceYears} Years Exp.</span>
                      <span className="badge badge-active">Rating ★ {selectedCase.assignedLawyer.rating}</span>
                    </div>

                    <p className="lawyer-bio-full mt-3">{selectedCase.assignedLawyer.bio}</p>

                    <div className="contact-actions-row mt-4">
                      <button 
                        className="btn btn-primary"
                        onClick={() => onNavigateTab('lawyer')}
                      >
                        <MessageSquare size={16} /> Open Lawyer Channel
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => alert(`Calling office: ${selectedCase.assignedLawyer.phone}`)}
                      >
                        Call Office ({selectedCase.assignedLawyer.phone})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && <div className="modal-overlay" onClick={() => setShowCreate(false)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><div><h3>Create a new case</h3><span className="text-xs text-muted">Describe the issue, review the draft, and choose your legal professional.</span></div><button className="btn-icon" onClick={() => setShowCreate(false)}><X size={20} /></button></div><form className="modal-body form-stack" onSubmit={submitCase}><div className="input-group"><label className="input-label">Describe what happened</label><textarea className="input-field" rows={5} minLength={30} maxLength={6000} required value={issue} onChange={event => setIssue(event.target.value)} placeholder="Explain the events, people or organisations involved, dates you remember, what outcome you need, and whether anything is urgent." /></div><button type="button" className="btn btn-secondary" disabled={drafting || issue.trim().length < 30} onClick={() => void createAiDraft()}><Sparkles size={16} /> {drafting ? 'Creating draft…' : 'Create draft with AI'}</button><div className="input-group"><label className="input-label">Case title</label><input className="input-field" required minLength={3} value={caseForm.title} onChange={event => setCaseForm({ ...caseForm, title: event.target.value })} /></div><div className="input-group"><label className="input-label">Category</label><select className="input-field" value={caseForm.category} onChange={event => setCaseForm({ ...caseForm, category: event.target.value })}><option>Property &amp; Real Estate</option><option>Consumer Protection</option><option>Civil Dispute</option><option>Employment &amp; Contract</option><option>Family Law</option><option>Intellectual Property</option></select></div><div className="input-group"><label className="input-label">Other party</label><input className="input-field" value={caseForm.opposingParty} onChange={event => setCaseForm({ ...caseForm, opposingParty: event.target.value })} placeholder="Person or organisation, if known" /></div><div className="input-group"><label className="input-label">Court</label><input className="input-field" value={caseForm.courtName} onChange={event => setCaseForm({ ...caseForm, courtName: event.target.value })} placeholder="Leave blank if the case has not been filed" /></div><div className="input-group"><label className="input-label">Issue summary</label><textarea className="input-field" rows={5} required minLength={20} value={caseForm.summary} onChange={event => setCaseForm({ ...caseForm, summary: event.target.value })} /></div><div className="input-group"><label className="input-label">Choose a legal professional</label><select className="input-field" required value={caseForm.lawyerUserId} onChange={event => setCaseForm({ ...caseForm, lawyerUserId: event.target.value })}><option value="">Select a legal professional</option>{lawyers.map(lawyer => <option key={lawyer.id} value={lawyer.id}>{lawyer.name}{lawyer.email ? ` · ${lawyer.email}` : ''}</option>)}</select>{lawyers.length === 0 && <span className="text-xs text-muted">No active legal professional accounts are available yet.</span>}</div>{formError && <div className="auth-error" role="alert">{formError}</div>}<div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" disabled={saving || lawyers.length === 0}>{saving ? 'Creating case…' : 'Create and send to lawyer'}</button></div></form></div></div>}

      <style>{`
        .cases-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-center;
        }

        .case-detail-header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .header-case-info h2 {
          font-size: 1.35rem;
        }

        .cnr-mono {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .cases-controls {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
        }

        .search-box {
          position: relative;
          width: 380px;
        }

        .search-box-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-box input {
          padding-left: 2.25rem;
        }

        .category-pills {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .pill-btn {
          padding: 0.4rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background-color: var(--bg-surface);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .pill-btn.active {
          background-color: var(--primary-600);
          color: #FFFFFF;
          border-color: var(--primary-600);
        }

        .cases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.25rem;
        }

        .case-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .case-card-top {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .cat-badge-wrap {
          display: flex;
          justify-content: space-between;
        }

        .case-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .court-info-box {
          background-color: var(--bg-app);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.8125rem;
        }

        .info-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card-progress {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .card-actions {
          display: flex;
          margin-top: auto;
        }

        .case-detail-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .grid-2-1 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        .summary-paragraph {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .particulars-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          background-color: var(--bg-app);
          padding: 1rem;
          border-radius: var(--radius-md);
        }

        .particular-item {
          display: flex;
          flex-direction: column;
        }

        .p-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .p-val {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .side-summary-box {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .next-hearing-box {
          background-color: rgba(217, 119, 6, 0.08);
          border: 1px solid rgba(217, 119, 6, 0.2);
          padding: 1rem;
          border-radius: var(--radius-md);
        }

        .nh-date {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--accent-amber);
        }

        .nh-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .nh-stage {
          font-weight: 600;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .nh-purpose {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .avatar-md {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .counsel-flex {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .c-name { font-weight: 700; font-size: 0.9375rem; }

        .timeline-flow {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          padding-left: 1rem;
        }

        .timeline-flow::before {
          content: '';
          position: absolute;
          left: 1.55rem;
          top: 0.5rem;
          bottom: 0.5rem;
          width: 2px;
          background-color: var(--border-color);
        }

        .timeline-item {
          display: flex;
          gap: 1.25rem;
          position: relative;
        }

        .timeline-marker {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          flex-shrink: 0;
        }

        .timeline-content {
          flex: 1;
          background-color: var(--bg-app);
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }

        .step-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .step-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .bench-notes-box {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          background-color: var(--bg-surface);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
        }

        .docs-table-wrapper {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .docs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.875rem;
        }

        .docs-table th {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .docs-table td {
          padding: 0.875rem 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .doc-title-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .doc-name { font-weight: 600; }
        .action-flex { display: flex; gap: 0.35rem; }

        .hearings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .hearing-log-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          padding: 1rem;
          border-radius: var(--radius-md);
        }

        .hl-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .hl-court { font-size: 0.8125rem; color: var(--text-secondary); }
        .hl-purpose { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.25rem; }

        .order-summary-box {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background-color: var(--bg-surface);
          border-left: 3px solid var(--primary-600);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
        }

        .lawyer-full-flex {
          display: flex;
          gap: 1.5rem;
        }

        .avatar-xl {
          width: 100px;
          height: 100px;
          border-radius: var(--radius-lg);
          object-fit: cover;
        }

        .lawyer-tags {
          display: flex;
          gap: 0.5rem;
        }

        .contact-actions-row {
          display: flex;
          gap: 0.875rem;
        }

        .mt-4 { margin-top: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }

        @media (max-width: 1024px) {
          .grid-2-1 {
            grid-template-columns: 1fr;
          }
          .cases-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
