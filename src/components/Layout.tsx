// UPDATED: 2026-01-22 10:44 IST - Fix sidebar visibility (avoid missing lg:flex) + target-like style
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
  X,
  UserCircle
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

  const userName = user?.full_name || company?.company_name || 'Averlon';

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/profile', icon: UserCircle, label: 'Profile' },
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      {/* NOTE: We use lg:block instead of lg:flex because the compiled CSS currently does not include lg:flex. */}
      <aside className="w-64 flex-shrink-0 h-full hidden lg:block" style={sidebarStyle}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center px-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-indigo-600" />
              </div>
              <span className="text-xl font-bold text-white">WorkEye</span>
            </div>
          </div>

          {/* Profile Card */}
          <div className="px-4 py-6">
            <button
              onClick={() => navigate('/profile')}
              className="w-full text-left bg-white/20 rounded-2xl p-4 border border-white/60 transition-colors hover:bg-white/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-lg">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{userName}</p>
                  <p className="text-xs text-blue-100">View profile</p>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 px-4 space-y-2 overflow-y-auto">
            {navigationItems.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(path)
                    ? 'bg-white text-indigo-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
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
      </aside>

      {/* Mobile Sidebar - Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 w-64 flex flex-col flex-shrink-0 h-full z-50 lg:hidden transform transition-transform duration-300"
            style={sidebarStyle}
          >
            {/* Mobile Header */}
            <div className="h-20 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Eye className="w-7 h-7 text-indigo-600" />
                </div>
                <span className="text-xl font-bold text-white">WorkEye</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Profile Card */}
            <div className="px-4 py-6">
              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full text-left bg-white/20 rounded-2xl p-4 border border-white/60 transition-colors hover:bg-white/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-lg">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{userName}</p>
                    <p className="text-xs text-blue-100">View profile</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-2 px-4 space-y-2 overflow-y-auto">
              {navigationItems.map(({ path, icon: Icon, label }) => (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(path)
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </nav>

            {/* Mobile Logout */}
            <div className="p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/20 hover:bg-white/40 text-white transition-all border border-white/60"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
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
