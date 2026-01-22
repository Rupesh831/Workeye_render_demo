// UPDATED: 2026-01-22 11:04 IST - Sidebar: reduce width, tighter spacing, compact layout
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

  const sidebarStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)'
  };

  const NavButton = ({ path, icon: Icon, label }: any) => (
    <button
      onClick={() => handleNavigate(path)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        isActive(path) ? 'bg-white text-indigo-600 shadow-sm' : 'text-white hover:bg-white/20'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const SidebarContent = ({ showMobileClose }: { showMobileClose?: boolean }) => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-base font-bold text-white">WorkEye</span>
        </div>

        {showMobileClose ? (
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-white">
            <X className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {/* Admin card */}
      <div className="px-3 pb-3">
        <button
          onClick={() => handleNavigate('/profile')}
          className="w-full text-left bg-white/20 rounded-xl px-3 py-2 border border-white/60 transition-colors hover:bg-white/30"
        >
          <p className="text-xs font-semibold text-white truncate">{adminName}</p>
          <p className="text-xs text-blue-100">Admin • View profile</p>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavButton key={item.path} {...item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all border border-white/60"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar - reduced width */}
      <aside className="w-56 flex-shrink-0 h-full hidden lg:block" style={sidebarStyle}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 h-full z-50 lg:hidden" style={sidebarStyle}>
            <SidebarContent showMobileClose />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">WorkEye</span>
          </div>
          <div className="w-10"></div>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
