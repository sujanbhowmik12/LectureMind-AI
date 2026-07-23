import React from 'react';
import { LayoutDashboard, Mic, Settings, LogOut, X } from 'lucide-react';
import { logout } from '../utils/firebase';

export default function Sidebar({ activeTab, setActiveTab, lectures, onOpenSettings, user, isOpen, onClose }) {
  const [imageError, setImageError] = React.useState(false);
  // Count total deadlines
  const totalDeadlines = lectures.reduce((sum, lec) => sum + (lec.deadlines ? lec.deadlines.length : 0), 0);
  const pendingDeadlines = lectures.reduce((sum, lec) => {
    return sum + (lec.deadlines ? lec.deadlines.filter(d => !d.completed).length : 0);
  }, 0);

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div>
        <div className="logo-container" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src="/logo.png" 
              alt="LectureMind Logo" 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                objectFit: 'cover',
                boxShadow: '0 4px 12px var(--accent-glow)' 
              }} 
            />
            <span className="logo-text">LectureMind AI</span>
          </div>
          {onClose && (
            <button 
              className="mobile-close-btn"
              onClick={onClose}
              title="Close Menu"
              aria-label="Close Menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav>
          <ul className="nav-links">
            <li 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </li>
            <li 
              className={`nav-item ${activeTab === 'record' ? 'active' : ''}`}
              onClick={() => setActiveTab('record')}
            >
              <Mic size={20} />
              Record & Upload
            </li>
            <li 
              className="nav-item"
              onClick={onOpenSettings}
            >
              <Settings size={20} />
              Settings
            </li>
          </ul>
        </nav>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="sidebar-stats">
          <h4>Workspace Stats</h4>
          <div className="stat-row">
            <span>Lectures</span>
            <span className="stat-val">{lectures.length}</span>
          </div>
          <div className="stat-row">
            <span>Assignments</span>
            <span className="stat-val">{totalDeadlines}</span>
          </div>
          <div className="stat-row">
            <span>Pending</span>
            <span className="stat-val" style={{ color: pendingDeadlines > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {pendingDeadlines}
            </span>
          </div>
        </div>

        {user && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            position: 'relative'
          }}>
            {user.photoURL && !imageError ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                onError={() => setImageError(true)}
                style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '1rem'
              }}>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.displayName || 'LectureMind User'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.email}
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '6px',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
