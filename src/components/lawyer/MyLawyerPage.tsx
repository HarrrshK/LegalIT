import React from 'react';
import { UserCheck } from 'lucide-react';
import type { Lawyer } from '../../types';

export const MyLawyerPage: React.FC<{ lawyer: Lawyer | null }> = ({ lawyer }) => (
  <div className="my-lawyer-page">
    <div className="page-header">
      <div>
        <h1>My Assigned Legal Counsel</h1>
        <p className="text-muted">Your assigned legal professional will appear here.</p>
      </div>
    </div>
    {lawyer ? <div className="card" style={{ padding: '2rem' }}>
      <h3>{lawyer.name}</h3>
      <p className="text-muted">{lawyer.title}</p>
      <p style={{ marginTop: '.75rem' }}>{lawyer.email}</p>
    </div> : <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
      <UserCheck size={42} className="text-muted" />
      <h3 style={{ marginTop: '1rem' }}>No legal professional assigned</h3>
      <p className="text-muted" style={{ marginTop: '.5rem' }}>Create a case and select a legal professional to connect with them.</p>
    </div>}
  </div>
);
