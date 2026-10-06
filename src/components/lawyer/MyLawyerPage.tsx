import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Send, 
  ShieldCheck, 
  Star
} from 'lucide-react';
import { mockAssignedLawyer } from '../../data/mockData';

export const MyLawyerPage: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'lawyer', time: 'Yesterday 04:30 PM', text: 'Hello Ananya. I have reviewed the written statement filed by SkyLine Realty. We will press for interim injunction under Order 39 Rule 1&2 at the Oct 18 hearing.' },
    { id: '2', sender: 'client', time: 'Yesterday 05:15 PM', text: 'Thank you Adv. Verma! Should I bring original bank statements to court?' },
    { id: '3', sender: 'lawyer', time: 'Today 10:00 AM', text: 'Yes, please keep the original bank passbook and allotment receipts ready. My junior counsel will meet you at High Court Gate 7 at 10:00 AM.' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'client',
        time: 'Just now',
        text: inputText
      }
    ]);
    setInputText('');
  };

  return (
    <div className="my-lawyer-page">
      <div className="page-header">
        <div>
          <h1>My Assigned Legal Counsel</h1>
          <p className="text-muted">Direct communication channel with your lead advocate and legal team</p>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Left Column: Direct Lawyer Messenger */}
        <div className="card messenger-card">
          <div className="messenger-header">
            <div className="lawyer-header-flex">
              <img src={mockAssignedLawyer.photoUrl} alt="" className="avatar-md" />
              <div>
                <h3>{mockAssignedLawyer.name}</h3>
                <span className="text-xs text-muted">{mockAssignedLawyer.title} • Bar: {mockAssignedLawyer.barRegistration}</span>
              </div>
            </div>
            <span className="badge badge-active"><ShieldCheck size={14} /> Privileged Channel</span>
          </div>

          <div className="messages-body">
            {messages.map(m => (
              <div key={m.id} className={`msg-wrapper ${m.sender === 'client' ? 'client-msg' : 'lawyer-msg'}`}>
                <div className="msg-bubble">
                  <div className="msg-meta">
                    <strong>{m.sender === 'client' ? 'Ananya Sharma' : 'Adv. Rajesh Verma'}</strong>
                    <span className="msg-time">{m.time}</span>
                  </div>
                  <p className="msg-text">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="messenger-form">
            <input 
              type="text" 
              className="input-field"
              placeholder="Send private message to Adv. Rajesh Verma..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <Send size={16} /> Send
            </button>
          </form>
        </div>

        {/* Right Column: Lawyer Details & Consultations */}
        <div className="side-stack">
          <div className="card">
            <h3>Advocate Details</h3>
            <div className="lawyer-details-list mt-3">
              <div className="detail-item">
                <Phone size={16} className="text-primary" />
                <div>
                  <span className="d-label">Chambers Phone</span>
                  <div className="d-val">{mockAssignedLawyer.phone}</div>
                </div>
              </div>

              <div className="detail-item">
                <Mail size={16} className="text-primary" />
                <div>
                  <span className="d-label">Official Email</span>
                  <div className="d-val">{mockAssignedLawyer.email}</div>
                </div>
              </div>

              <div className="detail-item">
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <div>
                  <span className="d-label">Client Rating</span>
                  <div className="d-val">{mockAssignedLawyer.rating} / 5.0 ({mockAssignedLawyer.reviewCount} Reviews)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Upcoming Consultations</h3>
            <div className="consult-slot mt-3">
              <Calendar size={18} className="text-amber" />
              <div>
                <strong>Next Conference:</strong>
                <div className="text-xs text-muted">Tomorrow at 11:00 AM (Pre-hearing briefing)</div>
              </div>
            </div>
            <button className="btn btn-outline btn-sm w-full mt-3" onClick={() => alert('Consultation request sent to advocate!')}>
              Schedule New Conference
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .my-lawyer-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .messenger-card {
          display: flex;
          flex-direction: column;
          height: 600px;
          padding: 0 !important;
          overflow: hidden;
        }

        .messenger-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-surface);
        }

        .lawyer-header-flex {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .messages-body {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background-color: var(--bg-app);
        }

        .msg-wrapper {
          display: flex;
          max-width: 80%;
        }

        .client-msg {
          align-self: flex-end;
        }

        .lawyer-msg {
          align-self: flex-start;
        }

        .msg-bubble {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1rem;
        }

        .client-msg .msg-bubble {
          background-color: var(--primary-600);
          color: #FFFFFF;
          border-color: var(--primary-600);
        }

        .msg-meta {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          font-size: 0.75rem;
          margin-bottom: 0.35rem;
        }

        .client-msg .msg-meta {
          color: rgba(255, 255, 255, 0.8);
        }

        .msg-text {
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .messenger-form {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background-color: var(--bg-surface);
          border-top: 1px solid var(--border-color);
        }

        .side-stack {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .lawyer-details-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .d-label { font-size: 0.75rem; color: var(--text-muted); }
        .d-val { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }

        .consult-slot {
          background-color: var(--bg-app);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
};
