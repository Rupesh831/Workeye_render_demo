// UPDATED: 2026-01-22 10:54 IST - Target sidebar: logo top, company/admin name (not clickable), menu items, logout; responsive mobile
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

  // Show company name first (target UI), fallback to user full name.
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive(path) ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/20'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Logo at TOP */}
      <div className="h-20 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Eye className="w-7 h-7 text-indigo-600" />
          </div>
          <span className="text-xl font-bold text-white">WorkEye</span>
        </div>
      </div>

      {/* Admin/Company name (NOT clickable) */}
      <div className="px-4 pb-4">
        <div className="bg-white/20 rounded-2xl px-4 py-3 border border-white/60">
          <p className="text-sm font-semibold text-white truncate">{adminName}</p>
          <p className="text-xs text-blue-100">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavButton key={item.path} {...item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/20 hover:bg-white/40 text-white transition-all border border-white/60"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      {/* NOTE: keep lg:block because current build output does not include lg:flex reliably. */}
      <aside className="w-64 flex-shrink-0 h-full hidden lg:block" style={sidebarStyle}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 w-64 h-full z-50 lg:hidden"
            style={sidebarStyle}
          >
            <div className="h-full flex flex-col">
              {/* Mobile top bar with close */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Eye className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-lg font-bold text-white">WorkEye</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Rest content */}
              <div className="flex-1 overflow-hidden">
                <SidebarContent />
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">WorkEye</span>
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
