import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const teacherNav = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/assignments', icon: '📋', label: 'Assignments' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const studentNav = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/assignments', icon: '📋', label: 'Assignments' },
  { to: '/my-submissions', icon: '📝', label: 'My Submissions' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'teacher' ? teacherNav : studentNav;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/assignments') return 'Assignments';
    if (path === '/assignments/new') return 'New Assignment';
    if (path.includes('/edit')) return 'Edit Assignment';
    if (path.includes('/submissions')) return 'Submissions';
    if (path === '/my-submissions') return 'My Submissions';
    if (path === '/profile') return 'Profile';
    return 'AMS';
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="app-layout">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div>
            <div className="logo-text">AMS</div>
            <div className="logo-sub">Assignment Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'teacher' && (
            <>
              <div className="nav-section-label" style={{ marginTop: '1rem' }}>
                Actions
              </div>
              <NavLink
                to="/assignments/new"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">➕</span>
                New Assignment
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-full btn-sm" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ display: 'none' }}
              id="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <span className="topbar-title">{getPageTitle()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className={`badge ${user?.role === 'teacher' ? 'badge-primary' : 'badge-info'}`}
            >
              {user?.role}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {user?.name}
            </span>
          </div>
        </div>

        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
