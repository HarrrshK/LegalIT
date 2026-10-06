import React, { useState, useEffect } from 'react';
import { Search, X, Briefcase, FileText, Calendar, UserCheck, Newspaper, ArrowRight } from 'lucide-react';
import { mockCases, mockLegalUpdates, mockLawyersDirectory } from '../../data/mockData';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string, caseId?: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTab
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search filter across datasets
  const matchingCases = mockCases.filter(c => 
    c.title.toLowerCase().includes(q) || 
    c.cnrNumber.toLowerCase().includes(q) || 
    c.category.toLowerCase().includes(q)
  );

  const matchingDocuments = mockCases.flatMap(c => c.documents).filter(d => 
    d.title.toLowerCase().includes(q) || 
    d.fileName.toLowerCase().includes(q) || 
    d.category.toLowerCase().includes(q)
  );

  const matchingHearings = mockCases.flatMap(c => c.hearings).filter(h => 
    h.caseTitle.toLowerCase().includes(q) || 
    h.courtName.toLowerCase().includes(q) ||
    h.stage.toLowerCase().includes(q)
  );

  const matchingLawyers = mockLawyersDirectory.filter(l => 
    l.name.toLowerCase().includes(q) || 
    l.specializations.some(s => s.toLowerCase().includes(q))
  );

  const matchingUpdates = mockLegalUpdates.filter(u => 
    u.title.toLowerCase().includes(q) || 
    u.summary.toLowerCase().includes(q) ||
    u.category.toLowerCase().includes(q)
  );

  const hasResults = 
    matchingCases.length > 0 || 
    matchingDocuments.length > 0 || 
    matchingHearings.length > 0 || 
    matchingLawyers.length > 0 || 
    matchingUpdates.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-modal-container" onClick={e => e.stopPropagation()}>
        <div className="search-input-header">
          <Search size={20} className="text-muted" />
          <input 
            type="text"
            className="search-input-field"
            placeholder="Type to search cases, documents, hearings, lawyers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="search-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="search-results-body">
          {query === '' ? (
            <div className="search-empty-state">
              <span className="empty-title">Quick Search</span>
              <p>Type keywords like "Skyline", "Property", "Rajesh", "Injunction", or "Supreme Court"</p>
            </div>
          ) : !hasResults ? (
            <div className="search-empty-state">
              <p>No results found matching "<strong>{query}</strong>"</p>
            </div>
          ) : (
            <div className="results-groups">
              {/* Cases */}
              {matchingCases.length > 0 && (
                <div className="result-group">
                  <div className="group-header">
                    <Briefcase size={14} /> Active Cases
                  </div>
                  {matchingCases.map(c => (
                    <div 
                      key={c.id} 
                      className="result-item"
                      onClick={() => {
                        onSelectTab('cases', c.id);
                        onClose();
                      }}
                    >
                      <div>
                        <div className="res-title">{c.title}</div>
                        <div className="res-subtitle">{c.cnrNumber} • {c.courtName}</div>
                      </div>
                      <ArrowRight size={16} className="res-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {matchingDocuments.length > 0 && (
                <div className="result-group">
                  <div className="group-header">
                    <FileText size={14} /> Documents Vault
                  </div>
                  {matchingDocuments.map(d => (
                    <div 
                      key={d.id} 
                      className="result-item"
                      onClick={() => {
                        onSelectTab('documents');
                        onClose();
                      }}
                    >
                      <div>
                        <div className="res-title">{d.title}</div>
                        <div className="res-subtitle">{d.fileName} ({d.fileSize})</div>
                      </div>
                      <ArrowRight size={16} className="res-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Hearings */}
              {matchingHearings.length > 0 && (
                <div className="result-group">
                  <div className="group-header">
                    <Calendar size={14} /> Hearings
                  </div>
                  {matchingHearings.map(h => (
                    <div 
                      key={h.id} 
                      className="result-item"
                      onClick={() => {
                        onSelectTab('hearings');
                        onClose();
                      }}
                    >
                      <div>
                        <div className="res-title">{h.stage}</div>
                        <div className="res-subtitle">{h.courtName} • {h.date} at {h.time}</div>
                      </div>
                      <ArrowRight size={16} className="res-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Lawyers */}
              {matchingLawyers.length > 0 && (
                <div className="result-group">
                  <div className="group-header">
                    <UserCheck size={14} /> Advocates & Directory
                  </div>
                  {matchingLawyers.map(l => (
                    <div 
                      key={l.id} 
                      className="result-item"
                      onClick={() => {
                        onSelectTab('find-help');
                        onClose();
                      }}
                    >
                      <div>
                        <div className="res-title">{l.name}</div>
                        <div className="res-subtitle">{l.title} • {l.location}</div>
                      </div>
                      <ArrowRight size={16} className="res-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Updates */}
              {matchingUpdates.length > 0 && (
                <div className="result-group">
                  <div className="group-header">
                    <Newspaper size={14} /> Legal Updates
                  </div>
                  {matchingUpdates.map(u => (
                    <div 
                      key={u.id} 
                      className="result-item"
                      onClick={() => {
                        onSelectTab('updates');
                        onClose();
                      }}
                    >
                      <div>
                        <div className="res-title">{u.title}</div>
                        <div className="res-subtitle">{u.courtOrBody} • {u.date}</div>
                      </div>
                      <ArrowRight size={16} className="res-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .search-modal-container {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 650px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .search-input-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .search-input-field {
          flex: 1;
          background: none;
          border: none;
          font-size: 1rem;
          font-family: inherit;
          color: var(--text-primary);
          outline: none;
        }

        .search-close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
        }

        .search-results-body {
          max-height: 420px;
          overflow-y: auto;
          padding: 1rem;
        }

        .search-empty-state {
          padding: 2.5rem 1rem;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-title {
          font-weight: 700;
          color: var(--text-primary);
          display: block;
          margin-bottom: 0.35rem;
        }

        .results-groups {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .group-header {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.5rem;
        }

        .result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .result-item:hover {
          background-color: var(--bg-surface-hover);
        }

        .res-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .res-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.1rem;
        }

        .res-arrow {
          color: var(--text-muted);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .result-item:hover .res-arrow {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};
