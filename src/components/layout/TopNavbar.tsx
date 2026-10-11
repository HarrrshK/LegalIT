import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  Plus, 
  ChevronDown, 
  User, 
  LogOut, 
  Check, 
  ShieldCheck,
  Calendar,
  FileText
} from 'lucide-react';
import type { AuthUser } from '../../types';
import { api } from '../../lib/api';

type StoredNotification = { id: string; kind: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string };

interface TopNavbarProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  authUser: AuthUser;
  onSignOut: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenMobileSidebar,
  onOpenSearch,
  setActiveTab,
  theme,
  setTheme,
  authUser,
  onSignOut
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);

  useEffect(() => { api<StoredNotification[]>('/notifications').then(setNotifications).catch(() => setNotifications([])); }, []);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(item => !item.read_at).map(item => api(`/notifications/${item.id}/read`, { method: 'POST' }))).catch(() => undefined);
    setNotifications(notifications.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button 
          className="mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Global Search Bar Button */}
        <button 
          className="navbar-search-btn"
          onClick={onOpenSearch}
        >
          <Search size={18} className="search-icon" />
          <span className="search-placeholder">Search cases, documents, hearings, lawyers...</span>
          <kbd className="search-shortcut">⌘K</kbd>
        </button>
      </div>

      <div className="navbar-right">
        {/* Quick AI Action Button */}
        <button 
          className="btn btn-primary btn-sm quick-ai-btn"
          onClick={() => setActiveTab('ai-assistant')}
        >
          <Plus size={16} />
          <span>Ask JurisAI</span>
        </button>

        {/* Theme Toggle */}
        <button 
          className="btn-icon theme-toggle"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} color="#F59E0B" />}
        </button>

        {/* Notification Bell & Popover */}
        <div className="popover-wrapper">
          <button 
            className="btn-icon notif-bell"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="popover-dropdown notif-dropdown">
              <div className="popover-header">
                <div className="header-title">
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="unread-pill">{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={markAllAsRead}>
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`notif-item ${!n.read_at ? 'unread' : ''}`}
                    onClick={() => {
                      if (n.link?.includes('/cases/')) setActiveTab('cases');
                      else if (n.link?.includes('/consultations/')) setActiveTab('find-help');
                      void api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => undefined);
                      setNotifications(current => current.map(item => item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item));
                      setShowNotifications(false);
                    }}
                  >
                    <div className="notif-icon">
                      {n.kind.includes('appointment') && <Calendar size={16} color="#D97706" />}
                      {n.kind.includes('document') && <FileText size={16} color="#2563EB" />}
                      {n.kind.includes('case') && <User size={16} color="#059669" />}
                      {n.kind.includes('consultation') && <ShieldCheck size={16} color="#7C3AED" />}
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-message">{n.body}</div>
                      <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Popover */}
        <div className="popover-wrapper">
          <button 
            className="profile-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div className="profile-avatar">{authUser.fullName.slice(0, 1).toUpperCase()}</div>
            <div className="profile-info">
              <span className="profile-name">{authUser.fullName}</span>
              <span className="profile-id">{authUser.userId}</span>
            </div>
            <ChevronDown size={16} className="profile-chevron" />
          </button>

          {showProfileMenu && (
            <div className="popover-dropdown profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="avatar-lg">{authUser.fullName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="p-name">{authUser.fullName}</div>
                  <div className="p-email">{authUser.email}</div>
                  <span className="badge badge-active mt-1">{authUser.role === 'lawyer' ? 'Legal Professional' : 'Client'}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button 
                className="dropdown-item"
                onClick={() => {
                  setActiveTab('settings');
                  setShowProfileMenu(false);
                }}
              >
                <User size={16} /> My Settings
              </button>

              <button 
                className="dropdown-item text-danger"
                onClick={onSignOut}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .top-navbar {
          height: 70px;
          background-color: var(--bg-header);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: var(--shadow-sm);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          max-width: 500px;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.25rem;
        }

        .navbar-search-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.5rem 1rem;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all var(--transition-fast);
        }

        .navbar-search-btn:hover {
          border-color: var(--primary-500);
          background-color: var(--bg-surface);
        }

        .search-placeholder {
          flex: 1;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-shortcut {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .popover-wrapper {
          position: relative;
        }

        .notif-bell {
          position: relative;
        }

        .notif-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          background-color: var(--accent-rose);
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.35rem 0.625rem;
          border-radius: var(--radius-md);
          background: none;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .profile-btn:hover {
          background-color: var(--bg-surface-hover);
          border-color: var(--border-color);
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          object-fit: cover;
          border: 2px solid var(--primary-500);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .profile-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .profile-id {
          font-size: 0.725rem;
          color: var(--text-muted);
        }

        .profile-chevron {
          color: var(--text-muted);
        }

        .popover-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .notif-dropdown {
          width: 360px;
        }

        .popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .header-title {
          font-weight: 700;
          font-size: 0.9375rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .unread-pill {
          font-size: 0.7rem;
          background-color: rgba(37, 99, 235, 0.1);
          color: var(--primary-600);
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-full);
          font-weight: 600;
        }

        .mark-read-btn {
          background: none;
          border: none;
          color: var(--primary-600);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .notif-list {
          max-height: 340px;
          overflow-y: auto;
        }

        .notif-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .notif-item:hover {
          background-color: var(--bg-surface-hover);
        }

        .notif-item.unread {
          background-color: rgba(37, 99, 235, 0.04);
        }

        .notif-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .notif-message {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.15rem;
        }

        .notif-time {
          font-size: 0.6875rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .profile-dropdown {
          width: 240px;
          padding: 0.5rem;
        }

        .profile-dropdown-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
        }

        .avatar-lg {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .p-name {
          font-weight: 700;
          font-size: 0.9375rem;
          line-height: 1.2;
        }

        .p-email {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .dropdown-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 0.375rem 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: none;
          background: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .dropdown-item:hover {
          background-color: var(--bg-surface-hover);
        }

        .dropdown-item.text-danger {
          color: var(--accent-rose);
        }

        @media (max-width: 1024px) {
          .mobile-menu-btn {
            display: block;
          }
          .profile-info {
            display: none;
          }
          .search-shortcut {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .quick-ai-btn span {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
