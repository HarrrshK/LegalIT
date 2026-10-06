import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Calendar, 
  UserCheck, 
  Bot, 
  Newspaper, 
  Search, 
  Settings, 
  Scale,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { mockCases } from '../../data/mockData';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const activeCasesCount = mockCases.filter(c => c.status !== 'Disposed').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'My Cases', icon: Briefcase, badge: activeCasesCount.toString() },
    { id: 'documents', label: 'Documents', icon: FileText, badge: '7' },
    { id: 'hearings', label: 'Hearings', icon: Calendar, badge: '3' },
    { id: 'lawyer', label: 'My Lawyer', icon: UserCheck },
    { id: 'ai-assistant', label: 'AI Legal Assistant', icon: Bot, highlight: 'AI' },
    { id: 'updates', label: 'Legal Updates', icon: Newspaper, highlight: 'NEW' },
    { id: 'find-help', label: 'Find Legal Help', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="mobile-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 49,
            backdropFilter: 'blur(3px)'
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Scale size={24} color="#FFFFFF" />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-title">NyayaFlow</span>
              <span className="brand-subtitle">Client Portal</span>
            </div>
          )}
          <button 
            className="mobile-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`nav-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={20} className="nav-icon" />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                
                {!isCollapsed && item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
                
                {!isCollapsed && item.highlight && (
                  <span className={`nav-pill ${item.highlight === 'AI' ? 'pill-ai' : 'pill-new'}`}>
                    {item.highlight}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle */}
        <div className="sidebar-footer">
          <button 
            className="collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 260px;
          background-color: var(--bg-sidebar);
          color: #94A3B8;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 50;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          transition: width var(--transition-normal);
        }

        .sidebar.collapsed {
          width: 76px;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1.25rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--primary-600), #3B82F6);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          flex-shrink: 0;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.02em;
        }

        .brand-subtitle {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #38BDF8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .mobile-close-btn {
          display: none;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          margin-left: auto;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow-y: auto;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 0.875rem;
          border-radius: var(--radius-md);
          color: #94A3B8;
          background: none;
          border: none;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }

        .nav-link:hover {
          color: #F8FAFC;
          background-color: rgba(255, 255, 255, 0.06);
        }

        .nav-link.active {
          color: #FFFFFF;
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.3) 0%, rgba(37, 99, 235, 0.1) 100%);
          border-left: 3px solid #3B82F6;
          font-weight: 600;
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .nav-link.active .nav-icon {
          color: #38BDF8;
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-badge {
          background-color: rgba(255, 255, 255, 0.1);
          color: #E2E8F0;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .nav-pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
        }

        .pill-ai {
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          color: #FFFFFF;
        }

        .pill-new {
          background-color: #059669;
          color: #FFFFFF;
        }

        .sidebar-footer {
          padding: 1rem 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .collapse-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem;
          background: none;
          border: none;
          color: #64748B;
          font-size: 0.8125rem;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .collapse-toggle:hover {
          color: #F8FAFC;
          background-color: rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 1024px) {
          .sidebar {
            position: fixed;
            left: -260px;
            top: 0;
            bottom: 0;
            transition: left var(--transition-normal);
          }

          .sidebar.mobile-open {
            left: 0;
          }

          .mobile-close-btn {
            display: block;
          }

          .collapse-toggle {
            display: none;
          }
        }
      `}</style>
    </>
  );
};
