import React, { useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  FileText, 
  Bot, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  Phone, 
  Sparkles, 
  Scale, 
  ChevronRight
} from 'lucide-react';
import { mockCases, mockAssignedLawyer, mockLegalUpdates, mockClientProfile } from '../../data/mockData';
import type { LegalCase } from '../../types';

interface DashboardHomeProps {
  onNavigateTab: (tab: string, caseId?: string) => void;
  onSendAIQuery: (query: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onNavigateTab,
  onSendAIQuery
}) => {
  const [quickQuery, setQuickQuery] = useState('');

  const nextHearingCase = mockCases.find(c => c.nextHearing);
  const nextHearing = nextHearingCase?.nextHearing;

  const handleAIQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      onSendAIQuery(quickQuery);
      onNavigateTab('ai-assistant');
    }
  };

  return (
    <div className="dashboard-home">
      {/* Welcome Hero Banner */}
      <section className="welcome-banner">
        <div className="welcome-text">
          <div className="client-badge">
            <ShieldCheck size={14} /> Verified Client Portal
          </div>
          <h1>Welcome back, {mockClientProfile.name}</h1>
          <p>
            You have <strong>{mockCases.length} active legal matters</strong> in progress. 
            {nextHearing && (
              <span> Next hearing scheduled for <strong>{nextHearing.date}</strong> at {nextHearing.courtName}.</span>
            )}
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={() => onNavigateTab('ai-assistant')}>
            <Sparkles size={18} /> Ask AI Assistant
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigateTab('cases')}>
            <Briefcase size={18} /> View All Cases
          </button>
        </div>
      </section>

      {/* 4 Summary Metric Cards */}
      <section className="metrics-grid">
        <div className="metric-card" onClick={() => onNavigateTab('cases')}>
          <div className="metric-icon icon-blue">
            <Briefcase size={22} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Active Cases</span>
            <span className="metric-value">{mockCases.length}</span>
            <span className="metric-sub text-success">All on schedule</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigateTab('hearings')}>
          <div className="metric-icon icon-amber">
            <Calendar size={22} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Upcoming Hearing</span>
            <span className="metric-value">18 Oct</span>
            <span className="metric-sub text-amber">High Court Courtroom 14</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigateTab('documents')}>
          <div className="metric-icon icon-emerald">
            <FileText size={22} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Documents Vault</span>
            <span className="metric-value">7 Documents</span>
            <span className="metric-sub">Verified & Secure</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigateTab('ai-assistant')}>
          <div className="metric-icon icon-purple">
            <Bot size={22} />
          </div>
          <div className="metric-data">
            <span className="metric-label">AI Legal Queries</span>
            <span className="metric-value">12 Asked</span>
            <span className="metric-sub text-purple">100% Citations Cited</span>
          </div>
        </div>
      </section>

      {/* Main Grid: My Cases + Next Hearing & Lawyer */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-main-col">
          {/* My Cases Section */}
          <div className="card">
            <div className="section-header">
              <div>
                <h2>My Active Cases</h2>
                <p className="text-muted">Track status, court bench, and case timeline progression</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigateTab('cases')}>
                View All <ChevronRight size={16} />
              </button>
            </div>

            <div className="cases-stack">
              {mockCases.map((caseItem: LegalCase) => (
                <div key={caseItem.id} className="case-row-card">
                  <div className="case-row-header">
                    <div className="case-title-block">
                      <span className="badge badge-primary">{caseItem.category}</span>
                      <h3>{caseItem.title}</h3>
                      <span className="cnr-text">CNR: {caseItem.cnrNumber}</span>
                    </div>
                    <span className={`badge ${
                      caseItem.status === 'Active' ? 'badge-active' : 
                      caseItem.status === 'In Hearing' ? 'badge-hearing' : 'badge-reserved'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <p className="case-summary-text">{caseItem.summary}</p>

                  <div className="progress-section">
                    <div className="progress-info">
                      <span>Case Progression Stage</span>
                      <span className="progress-val">{caseItem.progressPercent}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${caseItem.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="case-row-footer">
                    <div className="footer-meta">
                      <div className="meta-item">
                        <Scale size={14} />
                        <span>{caseItem.courtName}</span>
                      </div>
                      {caseItem.nextHearing && (
                        <div className="meta-item text-amber">
                          <Clock size={14} />
                          <span>Next Hearing: <strong>{caseItem.nextHearing.date}</strong></span>
                        </div>
                      )}
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigateTab('cases', caseItem.id)}
                    >
                      Case Overview <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prominent AI Assistant Card */}
          <div className="ai-prominent-card">
            <div className="ai-card-content">
              <div className="ai-card-badge">
                <Sparkles size={16} /> Powered by JurisAI RAG Engine
              </div>
              <h2>Need Immediate Legal Guidance?</h2>
              <p>
                Ask our legal assistant any question regarding your property suit, contract claims, 
                court procedures, or BNS/IPC legal sections. Get clear plain-English answers with citations.
              </p>

              <form onSubmit={handleAIQuerySubmit} className="ai-input-form">
                <input 
                  type="text" 
                  className="ai-input-box"
                  placeholder="e.g. What is the procedure for Order 39 Rule 2A CPC injunction?"
                  value={quickQuery}
                  onChange={e => setQuickQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Ask JurisAI <ArrowRight size={16} />
                </button>
              </form>

              <div className="prompt-chips">
                <span className="chips-label">Popular Prompts:</span>
                {[
                  'What is Lis Pendens under Sec 52?',
                  'How to speed up builder refund?',
                  'Explain Order 37 summary suit'
                ].map((prompt, idx) => (
                  <button 
                    key={idx}
                    type="button" 
                    className="chip-btn"
                    onClick={() => {
                      onSendAIQuery(prompt);
                      onNavigateTab('ai-assistant');
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-side-col">
          {/* Upcoming Hearing Card */}
          {nextHearing && (
            <div className="card hearing-focus-card">
              <div className="card-header-flex">
                <div className="header-icon-box">
                  <Calendar size={20} color="#D97706" />
                </div>
                <div>
                  <h4>Next Court Hearing</h4>
                  <span className="text-muted text-xs">High Court of Delhi</span>
                </div>
              </div>

              <div className="hearing-date-banner">
                <div className="h-date">{nextHearing.date}</div>
                <div className="h-time">{nextHearing.time}</div>
              </div>

              <div className="hearing-details-list">
                <div className="detail-line">
                  <span className="label">Bench:</span>
                  <span className="value">{nextHearing.bench}</span>
                </div>
                <div className="detail-line">
                  <span className="label">Stage:</span>
                  <span className="value">{nextHearing.stage}</span>
                </div>
                <div className="detail-line">
                  <span className="label">Judge:</span>
                  <span className="value">{nextHearing.judgeName}</span>
                </div>
              </div>

              <button 
                className="btn btn-outline btn-sm w-full mt-3"
                onClick={() => onNavigateTab('hearings')}
              >
                View Hearing Schedule
              </button>
            </div>
          )}

          {/* Assigned Lawyer Card */}
          <div className="card lawyer-summary-card">
            <div className="lawyer-card-header">
              <img src={mockAssignedLawyer.photoUrl} alt="" className="lawyer-avatar" />
              <div>
                <h4>{mockAssignedLawyer.name}</h4>
                <span className="text-xs text-muted">{mockAssignedLawyer.title}</span>
                <div className="rating-pill">★ {mockAssignedLawyer.rating} ({mockAssignedLawyer.reviewCount} reviews)</div>
              </div>
            </div>

            <p className="lawyer-bio">{mockAssignedLawyer.bio}</p>

            <div className="lawyer-meta-box">
              <div>Bar Reg: <strong>{mockAssignedLawyer.barRegistration}</strong></div>
              <div>Experience: <strong>{mockAssignedLawyer.experienceYears} Years</strong></div>
            </div>

            <div className="lawyer-action-buttons">
              <button 
                className="btn btn-primary btn-sm flex-1"
                onClick={() => onNavigateTab('lawyer')}
              >
                <MessageSquare size={14} /> Message
              </button>
              <button 
                className="btn btn-secondary btn-sm flex-1"
                onClick={() => onNavigateTab('lawyer')}
              >
                <Phone size={14} /> Call Office
              </button>
            </div>
          </div>

          {/* Recent Legal Updates Stream */}
          <div className="card updates-summary-card">
            <div className="section-header mb-3">
              <h4>Recent Legal Updates</h4>
              <button 
                className="btn-link text-xs" 
                onClick={() => onNavigateTab('updates')}
              >
                View Feed
              </button>
            </div>

            <div className="updates-mini-list">
              {mockLegalUpdates.slice(0, 2).map((item) => (
                <div 
                  key={item.id} 
                  className="mini-update-item"
                  onClick={() => onNavigateTab('updates')}
                >
                  <div className="mini-upd-header">
                    <span className="badge badge-neutral text-xs">{item.category}</span>
                    <span className="text-xs text-muted">{item.date}</span>
                  </div>
                  <h5 className="mini-upd-title">{item.title}</h5>
                  <p className="mini-upd-summary">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-home {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .welcome-banner {
          background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
          border-radius: var(--radius-xl);
          padding: 2.25rem 2.5rem;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .welcome-text {
          max-width: 650px;
        }

        .client-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background-color: rgba(56, 189, 248, 0.15);
          color: #38BDF8;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          margin-bottom: 0.75rem;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .welcome-text h1 {
          font-size: 1.875rem;
          color: #FFFFFF;
          margin-bottom: 0.5rem;
        }

        .welcome-text p {
          color: #94A3B8;
          font-size: 0.9375rem;
        }

        .welcome-text strong {
          color: #F8FAFC;
        }

        .welcome-actions {
          display: flex;
          gap: 0.875rem;
          flex-wrap: wrap;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        .metric-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary-500);
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-blue { background-color: rgba(37, 99, 235, 0.12); color: var(--primary-600); }
        .icon-amber { background-color: rgba(217, 119, 6, 0.12); color: var(--accent-amber); }
        .icon-emerald { background-color: rgba(5, 150, 105, 0.12); color: var(--accent-emerald); }
        .icon-purple { background-color: rgba(124, 58, 237, 0.12); color: var(--accent-purple); }

        .metric-data {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .metric-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .text-success { color: var(--accent-emerald); }
        .text-amber { color: var(--accent-amber); }
        .text-purple { color: var(--accent-purple); }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        .dashboard-main-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .dashboard-side-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .cases-stack {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .case-row-card {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          background-color: var(--bg-app);
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .case-row-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .case-title-block {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .case-title-block h3 {
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        .cnr-text {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .case-summary-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .progress-val {
          color: var(--primary-600);
        }

        .progress-bar-track {
          height: 8px;
          background-color: var(--border-color);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-600), #38BDF8);
          border-radius: var(--radius-full);
        }

        .case-row-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
        }

        .footer-meta {
          display: flex;
          gap: 1.25rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .ai-prominent-card {
          background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
          border-radius: var(--radius-xl);
          padding: 2rem;
          color: #FFFFFF;
          box-shadow: var(--shadow-md);
        }

        .ai-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background-color: rgba(236, 72, 153, 0.15);
          color: #F472B6;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          margin-bottom: 0.875rem;
        }

        .ai-card-content h2 {
          color: #FFFFFF;
          font-size: 1.35rem;
          margin-bottom: 0.5rem;
        }

        .ai-card-content p {
          color: #C7D2FE;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }

        .ai-input-form {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .ai-input-box {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.2);
          background-color: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          font-size: 0.875rem;
          outline: none;
        }

        .ai-input-box::placeholder {
          color: #A5B4FC;
        }

        .prompt-chips {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .chips-label {
          font-size: 0.75rem;
          color: #A5B4FC;
          font-weight: 600;
        }

        .chip-btn {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #E0E7FF;
          font-size: 0.75rem;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .chip-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .hearing-focus-card {
          border-top: 4px solid var(--accent-amber);
        }

        .card-header-flex {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .header-icon-box {
          width: 36px;
          height: 36px;
          background-color: rgba(217, 119, 6, 0.12);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hearing-date-banner {
          background-color: var(--bg-app);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          text-align: center;
          margin-bottom: 1rem;
        }

        .h-date {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--accent-amber);
        }

        .h-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .hearing-details-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.8125rem;
        }

        .detail-line {
          display: flex;
          justify-content: space-between;
        }

        .detail-line .label { color: var(--text-muted); }
        .detail-line .value { font-weight: 600; color: var(--text-primary); text-align: right; }

        .lawyer-card-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 0.875rem;
        }

        .lawyer-avatar {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .rating-pill {
          font-size: 0.725rem;
          color: var(--accent-amber);
          font-weight: 700;
          margin-top: 0.15rem;
        }

        .lawyer-bio {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-bottom: 0.875rem;
          line-height: 1.4;
        }

        .lawyer-meta-box {
          font-size: 0.75rem;
          color: var(--text-muted);
          background-color: var(--bg-app);
          padding: 0.625rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
        }

        .lawyer-action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .updates-mini-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mini-update-item {
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
        }

        .mini-upd-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }

        .mini-upd-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          margin-bottom: 0.25rem;
        }

        .mini-upd-summary {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .w-full { width: 100%; }
        .flex-1 { flex: 1; }
        .mt-3 { margin-top: 0.75rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .text-xs { font-size: 0.75rem; }

        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 640px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          .footer-meta {
            flex-direction: column;
            gap: 0.35rem;
          }
          .case-row-footer {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};
