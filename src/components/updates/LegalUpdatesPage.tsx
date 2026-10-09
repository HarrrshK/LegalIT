import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  Calendar, 
  Scale, 
  X
} from 'lucide-react';
import { legalUpdates } from '../../data/emptyData';
import type { LegalUpdate } from '../../types';

export const LegalUpdatesPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUpdate, setSelectedUpdate] = useState<LegalUpdate | null>(null);

  const categories = [
    'All',
    'Supreme Court',
    'High Courts',
    'Acts & Amendments',
    'Rules & Regulations',
    'Notifications'
  ];

  const filteredUpdates = legalUpdates.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courtOrBody.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="updates-page">
      <div className="page-header">
        <div>
          <h1>Legal Updates & Judgments</h1>
          <p className="text-muted">Stay informed on landmark rulings, legislative changes, and regulatory notifications</p>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="controls-row">
        <div className="search-box">
          <Search size={18} className="search-box-icon" />
          <input 
            type="text"
            className="input-field"
            placeholder="Search updates by keyword, court, or act..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-pills">
          {categories.map(cat => (
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

      {/* Updates Grid */}
      <div className="updates-grid">
        {filteredUpdates.map(item => (
          <div key={item.id} className="card update-card">
            <div className="upd-top">
              <span className={`badge ${
                item.impactLevel === 'High Impact' ? 'badge-hearing' : 'badge-primary'
              }`}>
                {item.impactLevel}
              </span>
              <span className="badge badge-neutral">{item.category}</span>
              <span className="upd-date"><Calendar size={13} /> {item.date}</span>
            </div>

            <h3 className="upd-title">{item.title}</h3>

            <div className="upd-court">
              <Scale size={14} /> {item.courtOrBody}
            </div>

            <p className="upd-summary">{item.summary}</p>

            <div className="takeaway-box">
              <strong>Litigant Impact:</strong> {item.keyTakeaway}
            </div>

            <div className="upd-actions mt-auto">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedUpdate(item)}
              >
                Read Full Summary & Analysis
              </button>
              {item.officialLink && (
                <a 
                  href={item.officialLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  Official Link <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
        {filteredUpdates.length === 0 && <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>No legal updates are available.</div>}
      </div>

      {/* Full Update Detail Modal */}
      {selectedUpdate && (
        <div className="modal-overlay" onClick={() => setSelectedUpdate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-primary mb-1">{selectedUpdate.category}</span>
                <h3>{selectedUpdate.title}</h3>
                <span className="text-xs text-muted">{selectedUpdate.courtOrBody} • {selectedUpdate.date}</span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedUpdate(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="takeaway-box mb-4">
                <strong>Key Takeaway:</strong> {selectedUpdate.keyTakeaway}
              </div>

              <div className="full-text">
                {selectedUpdate.fullContent.split('\n\n').map((para, idx) => (
                  <p key={idx} className="mb-3">{para}</p>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedUpdate(null)}>
                Close
              </button>
              {selectedUpdate.officialLink && (
                <a 
                  href={selectedUpdate.officialLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  View Official Court Order <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .updates-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .controls-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
        }

        .updates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.25rem;
        }

        .update-card {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .upd-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .upd-date {
          margin-left: auto;
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .upd-title {
          font-size: 1.1rem;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .upd-court {
          font-size: 0.8125rem;
          color: var(--primary-600);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .upd-summary {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .takeaway-box {
          background-color: var(--bg-app);
          border-left: 3px solid var(--accent-emerald);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--text-primary);
        }

        .upd-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
        }

        .full-text {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .mt-auto { margin-top: auto; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
      `}</style>
    </div>
  );
};
