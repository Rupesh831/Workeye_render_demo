// UPDATED: 2026-01-22 11:16 IST - Hard override layout/sidebar using custom CSS classes (Tailwind build missing many utilities)
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersIcon,
  ClipboardList,
  Settings,
  LogOut,
  Eye,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminName = company?.company_name || user?.full_name || 'Averlon';
  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/members', icon: UsersIcon, label: 'Team' },
    { path: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { path: '/configuration', icon: Settings, label: 'Settings' }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ showMobileClose }: { showMobileClose?: boolean }) => (
    <aside className={showMobileClose ? 'we-sidebar we-sidebar-mobile' : 'we-sidebar we-desktop-only'}>
      {/* Top logo */}
      <div className="we-sidebar-header">
        <div className="we-logo" onClick={() => handleNavigate('/dashboard')} role="button" tabIndex={0}>
          <span className="we-logo-icon">
            <Eye className="we-icon" />
          </span>
          <span className="we-logo-text">WorkEye</span>
        </div>

        {showMobileClose ? (
          <button className="we-icon-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X className="we-icon" />
          </button>
        ) : null}
      </div>

      {/* Admin name (click -> /profile) */}
      <div className="we-sidebar-section">
        <button className="we-admin-card" onClick={() => handleNavigate('/profile')}>
          <div className="we-admin-title">{adminName}</div>
          <div className="we-admin-sub">Admin • View profile</div>
        </button>
      </div>

      {/* Menu (GREEN in your screenshot) */}
      <nav className="we-nav">
        {navigationItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            className={`we-nav-btn ${isActive(path) ? 'active' : ''}`}
            onClick={() => handleNavigate(path)}
          >
            <Icon className="we-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Push logout to bottom */}
      <div className="we-spacer" />

      {/* Logout (GREEN in your screenshot) */}
      <div className="we-sidebar-section">
        <button className="we-logout" onClick={handleLogout}>
          <LogOut className="we-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="we-app">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      {mobileMenuOpen ? (
        <>
          <div className="we-overlay" onClick={() => setMobileMenuOpen(false)} />
          <Sidebar showMobileClose />
        </>
      ) : null}

      {/* Main */}
      <div className="we-main">
        <div className="we-mobile-header we-mobile-only">
          <button className="we-icon-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu className="we-icon" />
          </button>
          <div className="we-mobile-brand">
            <span className="we-mobile-brand-icon">
              <Eye className="we-icon" />
            </span>
            <span className="we-mobile-brand-text">WorkEye</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        <main className="we-content">{children}</main>
      </div>
    </div>
  );
}
