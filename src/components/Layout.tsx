// UPDATED: 2026-01-22 11:09 IST - GeoTrack-style sidebar: logo top, admin section, clean menu, bottom stats panel
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
  Crown
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

  const NavButton = ({ path, icon: Icon, label }: any) => (
    <button
      onClick={() => handleNavigate(path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
        isActive(path)
          ? 'bg-indigo-600 text-white font-medium shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );

  const SidebarContent = ({ showMobileClose }: { showMobileClose?: boolean }) => (
    <div className="h-full flex flex-col bg-white">
      {/* Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">WorkEye</span>
        </div>
        {showMobileClose && (
          <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin Section */}
      <div className="px-3 pt-4 pb-3">
        <button
          onClick={() => handleNavigate('/profile')}
          className="w-full text-left bg-pink-50 rounded-xl p-3 border border-pink-200 transition-colors hover:bg-pink-100"
        >
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-pink-600" />
            <p className="text-xs font-bold text-pink-600 uppercase tracking-wide">SUPER ADMIN</p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{adminName}</p>
          <p className="text-xs text-gray-500 mt-0.5">All companies access</p>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavButton key={item.path} {...item} />
        ))}
      </nav>

      {/* Bottom Stats Panel */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-200">
        <div className="bg-indigo-50 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-indigo-600" />
            <p className="text-xs font-bold text-indigo-900">Super Administrator</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Users</span>
              <span className="font-semibold text-gray-900">0/</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Clients</span>
              <span className="font-semibold text-gray-900">Unlimited</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Storage</span>
              <span className="font-semibold text-gray-900">Unlimited</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="w-56 flex-shrink-0 h-full hidden lg:block border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 h-full z-50 lg:hidden shadow-xl">
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
