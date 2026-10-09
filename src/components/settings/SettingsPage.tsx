import React, { useState } from 'react';
import { User, Bell, Moon, Sun, Save, Check } from 'lucide-react';
import { emptyClientProfile } from '../../data/emptyData';
import type { AuthUser } from '../../types';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  authUser: AuthUser;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  theme,
  setTheme,
  authUser
}) => {
  const [profile, setProfile] = useState({ ...emptyClientProfile, id: authUser.id, name: authUser.fullName, clientId: authUser.userId, email: authUser.email });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Account Settings & Preferences</h1>
          <p className="text-muted">Manage your profile, notification channels, security, and portal appearance</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-stack">
        {/* Profile Card */}
        <div className="card">
          <div className="card-header-line">
            <User size={20} className="text-primary" />
            <h3>Profile Information</h3>
          </div>

          <div className="form-grid mt-4">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Client System ID</label>
              <input 
                type="text" 
                className="input-field" 
                value={profile.clientId}
                disabled
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input 
                type="tel" 
                className="input-field" 
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">Residential Address</label>
              <input 
                type="text" 
                className="input-field" 
                value={profile.address}
                onChange={e => setProfile({ ...profile, address: e.target.value })}
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">Emergency Contact Person</label>
              <input 
                type="text" 
                className="input-field" 
                value={profile.emergencyContact}
                onChange={e => setProfile({ ...profile, emergencyContact: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Notifications Preference */}
        <div className="card">
          <div className="card-header-line">
            <Bell size={20} className="text-primary" />
            <h3>Notification Preferences</h3>
          </div>

          <div className="checkbox-stack mt-4">
            <label className="checkbox-row">
              <input 
                type="checkbox" 
                checked={profile.notificationsEnabled.sms}
                onChange={e => setProfile({
                  ...profile,
                  notificationsEnabled: { ...profile.notificationsEnabled, sms: e.target.checked }
                })}
              />
              <div>
                <strong>SMS Hearing Alerts</strong>
                <p className="text-xs text-muted">Receive SMS reminder 24 hours prior to scheduled court hearings</p>
              </div>
            </label>

            <label className="checkbox-row">
              <input 
                type="checkbox" 
                checked={profile.notificationsEnabled.whatsapp}
                onChange={e => setProfile({
                  ...profile,
                  notificationsEnabled: { ...profile.notificationsEnabled, whatsapp: e.target.checked }
                })}
              />
              <div>
                <strong>WhatsApp Instant Updates</strong>
                <p className="text-xs text-muted">Receive instant document upload & order summary notes on WhatsApp</p>
              </div>
            </label>

            <label className="checkbox-row">
              <input 
                type="checkbox" 
                checked={profile.notificationsEnabled.email}
                onChange={e => setProfile({
                  ...profile,
                  notificationsEnabled: { ...profile.notificationsEnabled, email: e.target.checked }
                })}
              />
              <div>
                <strong>Email Digest & Legal News</strong>
                <p className="text-xs text-muted">Weekly case status summary and high-impact legal updates</p>
              </div>
            </label>
          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="card">
          <div className="card-header-line">
            {theme === 'dark' ? <Moon size={20} color="#38BDF8" /> : <Sun size={20} color="#F59E0B" />}
            <h3>Portal Theme & Appearance</h3>
          </div>

          <div className="theme-options mt-4">
            <button 
              type="button" 
              className={`theme-card-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={24} color="#F59E0B" />
              <span>Clean Light Mode</span>
            </button>

            <button 
              type="button" 
              className={`theme-card-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={24} color="#38BDF8" />
              <span>Modern Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="save-bar">
          <button type="submit" className="btn btn-primary btn-lg">
            {isSaved ? <Check size={18} /> : <Save size={18} />}
            {isSaved ? 'Settings Saved Successfully!' : 'Save All Preferences'}
          </button>
        </div>
      </form>

      <style>{`
        .settings-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-stack {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .card-header-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .full-width {
          grid-column: span 2;
        }

        .checkbox-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          cursor: pointer;
        }

        .checkbox-row input {
          width: 18px;
          height: 18px;
          margin-top: 0.15rem;
        }

        .theme-options {
          display: flex;
          gap: 1rem;
        }

        .theme-card-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-color);
          background-color: var(--bg-app);
          color: var(--text-primary);
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .theme-card-btn.active {
          border-color: var(--primary-500);
          background-color: var(--bg-surface);
        }

        .save-bar {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .full-width {
            grid-column: span 1;
          }
          .theme-options {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
