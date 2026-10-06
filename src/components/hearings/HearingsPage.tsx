import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Scale } from 'lucide-react';
import { mockCases } from '../../data/mockData';

export const HearingsPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const allHearings = mockCases.flatMap(c => c.hearings);

  const filteredHearings = allHearings.filter(h => {
    if (filterStatus === 'All') return true;
    return h.status === filterStatus;
  });

  return (
    <div className="hearings-page">
      <div className="page-header-flex">
        <div>
          <h1>Court Hearing Schedules</h1>
          <p className="text-muted">Track courtroom numbers, judge benches, daily order notes, and hearing dates</p>
        </div>

        <button className="btn btn-secondary" onClick={() => alert('Calendar synced with your mobile calendar!')}>
          <Calendar size={18} /> Sync with iCal / Google Calendar
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="category-pills">
        {['All', 'Upcoming', 'Completed'].map(st => (
          <button
            key={st}
            className={`pill-btn ${filterStatus === st ? 'active' : ''}`}
            onClick={() => setFilterStatus(st)}
          >
            {st} Hearings
          </button>
        ))}
      </div>

      {/* Hearings Stack */}
      <div className="hearings-stack">
        {filteredHearings.map(h => (
          <div key={h.id} className="card hearing-item-card">
            <div className="h-left-badge">
              <div className="h-month-date">{h.date}</div>
              <div className="h-time-tag"><Clock size={12} /> {h.time}</div>
              <span className={`badge ${h.status === 'Upcoming' ? 'badge-hearing' : 'badge-active'} mt-2`}>
                {h.status}
              </span>
            </div>

            <div className="h-main-info">
              <div className="h-case-title">{h.caseTitle}</div>
              <span className="cnr-text">CNR: {h.cnrNumber}</span>

              <div className="h-location-grid mt-2">
                <div className="loc-line">
                  <Scale size={15} className="text-primary" /> <strong>Court:</strong> {h.courtName}
                </div>
                <div className="loc-line">
                  <MapPin size={15} className="text-amber" /> <strong>Bench / Room:</strong> {h.bench} (Room #{h.roomNumber})
                </div>
                <div className="loc-line">
                  <strong>Presiding Judge:</strong> {h.judgeName}
                </div>
              </div>

              <div className="h-stage-box mt-2">
                <strong>Hearing Purpose / Stage:</strong> {h.purpose}
              </div>

              {h.previousOrderSummary && (
                <div className="previous-order-note mt-2">
                  <strong>Daily Order Summary:</strong> {h.previousOrderSummary}
                </div>
              )}
            </div>

            <div className="h-actions">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => alert(`Directions for ${h.courtName}: Arrive 15 minutes prior at Room ${h.roomNumber}.`)}
              >
                Court Room Directions
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .hearings-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hearings-stack {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .hearing-item-card {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .h-left-badge {
          width: 140px;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .h-month-date {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--primary-600);
        }

        .h-time-tag {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.25rem;
        }

        .h-main-info {
          flex: 1;
        }

        .h-case-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .h-location-grid {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.8125rem;
          background-color: var(--bg-app);
          padding: 0.75rem;
          border-radius: var(--radius-md);
        }

        .loc-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .h-stage-box {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .previous-order-note {
          font-size: 0.8125rem;
          background-color: var(--bg-app);
          border-left: 3px solid var(--primary-600);
          padding: 0.625rem;
          border-radius: var(--radius-sm);
        }

        .h-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .hearing-item-card {
            flex-direction: column;
          }
          .h-left-badge {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
