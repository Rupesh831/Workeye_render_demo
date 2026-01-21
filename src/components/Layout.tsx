// UPDATED: 2026-01-21 22:55 IST - Fixed sidebar width
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersIcon,
  ClipboardList,
  Settings,
  ChevronDown,
  UserCircle,
  Download,
  LogOut,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [downloadingTracker, setDownloadingTracker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = user?.full_name || company?.company_name || 'Averlon';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadTracker = async () => {
    try {
      setDownloadingTracker(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/tracker/download`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to download tracker');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workeye-tracker.exe';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingTracker(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Sidebar - Always Visible */}
      <aside 
        className="bg-slate-50 flex flex-col flex-shrink-0 h-full"
        style={{ width: '256px', boxShadow: '5px 0 15px rgba(163, 177, 198, 0.3)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center"
              style={{ boxShadow: '4px 4px 8px rgba(99, 102, 241, 0.3), -2px -2px 6px rgba(255, 255, 255, 0.8)' }}
            >
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">WorkEye</span>
          </div>
        </div>

        {/* Profile at Top - Clickable */}
        <div className="px-4 py-4 border-b border-slate-200">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-200 transition-all"
            style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
          >
            <div 
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-sm text-slate-500">View Profile</p>
            </div>
          </button>
        </div>

        {/* Navigation - Stacked Vertically */}
        <nav className="flex-1 py-4 px-3 gap-2 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/members', icon: UsersIcon, label: 'Team' },
            { path: '/attendance', icon: ClipboardList, label: 'Attendance' },
            { path: '/configuration', icon: Settings, label: 'Settings' }
          ].map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                isActive(path)
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              style={isActive(path)
                ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' }
                : { boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Profile Dropdown at Bottom */}
        <div className="p-4 border-t border-slate-200">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-200 transition-all"
              style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
            >
              <div 
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.4)' }}
              >
                <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                <p className="text-sm text-slate-500">Options</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>

            {showProfileDropdown && (
              <div 
                className="absolute bg-slate-50 rounded-2xl overflow-hidden"
                style={{ 
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: '8px',
                  boxShadow: '8px 8px 20px rgba(163, 177, 198, 0.6), -8px -8px 20px rgba(255, 255, 255, 0.9)' 
                }}
              >
                <button
                  onClick={() => { navigate('/profile'); setShowProfileDropdown(false); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors"
                >
                  <UserCircle className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">My Profile</span>
                </button>
                <button
                  onClick={handleDownloadTracker}
                  disabled={downloadingTracker}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
                  </span>
                </button>
                <div className="h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" style={{ height: '1px' }}></div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
          {children}
        </main>
      </div>
    </div>
  );
}
