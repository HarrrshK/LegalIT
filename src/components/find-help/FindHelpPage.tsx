import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  UserCheck, 
  Video, 
  Building, 
  CheckCircle, 
  X
} from 'lucide-react';
import type { Lawyer, LegalDomain } from '../../types';

export const FindHelpPage: React.FC<{ lawyers: Lawyer[] }> = ({ lawyers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All');
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [minRating, setMinRating] = useState<number>(0);
  const [bookingLawyer, setBookingLawyer] = useState<Lawyer | null>(null);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState('2026-10-09');
  const [bookingSlot, setBookingSlot] = useState('11:00 AM');
  const [bookingMode, setBookingMode] = useState<'online' | 'in-person'>('online');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  const specializations: string[] = [
    'All',
    'Property & Real Estate',
    'Consumer Protection',
    'Civil Dispute',
    'Employment & Contract',
    'Family Law',
    'Intellectual Property'
  ];

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = 
      lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.courtPractice.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpec = selectedSpecialization === 'All' || 
      lawyer.specializations.includes(selectedSpecialization as LegalDomain);

    const matchesDist = lawyer.distanceKm <= maxDistance;
    const matchesRate = lawyer.rating >= minRating;

    return matchesSearch && matchesSpec && matchesDist && matchesRate;
  });

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      setBookingLawyer(null);
      alert(`Consultation booked with ${bookingLawyer?.name} for ${bookingDate} at ${bookingSlot}. Confirmation sent via SMS & Email!`);
    }, 1200);
  };

  return (
    <div className="find-help-page">
      <div className="page-header">
        <div>
          <h1>Find Nearby Legal Help</h1>
          <p className="text-muted">Connect with verified Advocates, High Court practitioners, and Legal Specialists near you</p>
        </div>
      </div>

      {/* Search & Multi-Filters */}
      <div className="card filter-panel">
        <div className="filter-top-row">
          <div className="search-box flex-1">
            <Search size={18} className="search-box-icon" />
            <input 
              type="text" 
              className="input-field"
              placeholder="Search advocates by name, landmark location (e.g. Connaught Place, Saket)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-selects">
            <div className="input-group">
              <select 
                className="input-field"
                value={maxDistance}
                onChange={e => setMaxDistance(Number(e.target.value))}
              >
                <option value={50}>Distance: Any Distance</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={20}>Within 20 km</option>
              </select>
            </div>

            <div className="input-group">
              <select 
                className="input-field"
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
              >
                <option value={0}>Rating: Any Rating</option>
                <option value={4.8}>4.8+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        {/* Specialization Chips */}
        <div className="spec-chips-row">
          <span className="text-xs font-semibold text-muted">Specialization:</span>
          {specializations.map(spec => (
            <button
              key={spec}
              className={`pill-btn ${selectedSpecialization === spec ? 'active' : ''}`}
              onClick={() => setSelectedSpecialization(spec)}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="lawyers-grid">
        {filteredLawyers.map(lawyer => (
          <div key={lawyer.id} className="card lawyer-card">
            {lawyer.isAssigned && (
              <div className="assigned-badge">
                <CheckCircle size={14} /> Currently Assigned Counsel
              </div>
            )}

            <div className="lawyer-card-top">
              <img src={lawyer.photoUrl} alt="" className="avatar-lg" />
              <div className="lawyer-meta">
                <h3>{lawyer.name}</h3>
                <span className="lawyer-title">{lawyer.title}</span>
                <div className="rating-row">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <strong className="text-amber">{lawyer.rating}</strong>
                  <span className="text-muted text-xs">({lawyer.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            <div className="lawyer-location-row">
              <div className="loc-item">
                <MapPin size={14} className="text-primary" /> {lawyer.location} ({lawyer.distanceKm} km away)
              </div>
              <div className="loc-item">
                <UserCheck size={14} /> {lawyer.experienceYears} Years Exp • Bar: {lawyer.barRegistration}
              </div>
            </div>

            <p className="lawyer-bio-excerpt">{lawyer.bio}</p>

            <div className="specs-list">
              {lawyer.specializations.map((spec, i) => (
                <span key={i} className="badge badge-primary text-xs">{spec}</span>
              ))}
            </div>

            <div className="courts-list text-xs text-muted">
              <strong>Courts:</strong> {lawyer.courtPractice.join(', ')}
            </div>

            <div className="fee-booking-row">
              <div className="fee-box">
                <span className="text-xs text-muted">Consultation Fee</span>
                <span className="fee-amount">₹{lawyer.consultationFee.toLocaleString('en-IN')}</span>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setBookingLawyer(lawyer);
                  setIsBooked(false);
                }}
              >
                Book Consultation
              </button>
            </div>
          </div>
        ))}
        {filteredLawyers.length === 0 && <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>No legal professionals are listed.</div>}
      </div>

      {/* Consultation Booking Modal */}
      {bookingLawyer && (
        <div className="modal-overlay" onClick={() => setBookingLawyer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Schedule Consultation</h3>
                <span className="text-xs text-muted">with {bookingLawyer.name} ({bookingLawyer.title})</span>
              </div>
              <button className="btn-icon" onClick={() => setBookingLawyer(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="modal-body">
              {isBooked ? (
                <div className="booking-success-box">
                  <CheckCircle size={48} color="#059669" />
                  <h4>Consultation Confirmed!</h4>
                  <p>Sending confirmation details to your phone & email...</p>
                </div>
              ) : (
                <div className="form-stack">
                  {/* Mode Selector */}
                  <div className="input-group">
                    <label className="input-label">Consultation Mode</label>
                    <div className="mode-toggle-group">
                      <button 
                        type="button" 
                        className={`mode-btn ${bookingMode === 'online' ? 'active' : ''}`}
                        onClick={() => setBookingMode('online')}
                      >
                        <Video size={16} /> Online Video Meeting
                      </button>
                      <button 
                        type="button" 
                        className={`mode-btn ${bookingMode === 'in-person' ? 'active' : ''}`}
                        onClick={() => setBookingMode('in-person')}
                      >
                        <Building size={16} /> In-Person Office Visit
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Slot */}
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Select Date</label>
                      <input 
                        type="date"
                        className="input-field"
                        value={bookingDate}
                        onChange={e => setBookingDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Available Slot</label>
                      <select 
                        className="input-field"
                        value={bookingSlot}
                        onChange={e => setBookingSlot(e.target.value)}
                      >
                        <option value="11:00 AM">11:00 AM (Morning)</option>
                        <option value="02:30 PM">02:30 PM (Afternoon)</option>
                        <option value="05:00 PM">05:00 PM (Evening)</option>
                      </select>
                    </div>
                  </div>

                  {/* Brief Notes */}
                  <div className="input-group">
                    <label className="input-label">Brief Case / Consultation Objective</label>
                    <textarea 
                      className="input-field"
                      rows={3}
                      placeholder="Briefly state your query e.g., 'Discussion on interim stay order for Sector 62 flat'."
                      value={bookingNotes}
                      onChange={e => setBookingNotes(e.target.value)}
                    />
                  </div>

                  <div className="fee-summary-banner">
                    <span>Consultation Fee: <strong>₹{bookingLawyer.consultationFee}</strong></span>
                    <span className="text-xs text-muted">Payable at time of session</span>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setBookingLawyer(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Confirm Appointment
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <style>{`
        .find-help-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .filter-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-top-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-selects {
          display: flex;
          gap: 0.75rem;
        }

        .spec-chips-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .lawyers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.25rem;
        }

        .lawyer-card {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          position: relative;
        }

        .assigned-badge {
          background-color: rgba(5, 150, 105, 0.12);
          color: var(--accent-emerald);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          align-self: flex-start;
        }

        .lawyer-card-top {
          display: flex;
          gap: 1rem;
        }

        .lawyer-title {
          font-size: 0.785rem;
          color: var(--text-muted);
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.25rem;
        }

        .lawyer-location-row {
          background-color: var(--bg-app);
          padding: 0.625rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8125rem;
        }

        .loc-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--text-secondary);
        }

        .lawyer-bio-excerpt {
          font-size: 0.84rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .specs-list {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .fee-booking-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
          margin-top: auto;
        }

        .fee-box {
          display: flex;
          flex-direction: column;
        }

        .fee-amount {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--primary-600);
        }

        .mode-toggle-group {
          display: flex;
          gap: 0.75rem;
        }

        .mode-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-surface);
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
        }

        .mode-btn.active {
          border-color: var(--primary-600);
          background-color: var(--primary-50);
          color: var(--primary-600);
        }

        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .fee-summary-banner {
          background-color: var(--bg-app);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .booking-success-box {
          padding: 2.5rem 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
};
