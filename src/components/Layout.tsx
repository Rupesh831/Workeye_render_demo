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
  Eye,
  Search,
  Calendar,
  Bell,
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [downloadingTracker, setDownloadingTracker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      '/dashboard': 'Analytics Overview',
      '/members': 'Team Management',
      '/attendance': 'Attendance Records',
      '/configuration': 'System Settings',
      '/profile': 'My Profile'
    };
    return titles[location.pathname] || 'Dashboard';
  };

  const getPageSubtitle = () => {
    const subtitles: { [key: string]: string } = {
      '/dashboard': 'Track your team\'s performance',
      '/members': 'Manage your team members',
      '/attendance': 'View attendance history',
      '/configuration': 'Configure your workspace',
      '/profile': 'Manage your account'
    };
    return subtitles[location.pathname] || '';
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#e8ecf3] via-[#e8ecf3] to-[#d4dae6] overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#e8ecf3] transition-all duration-300 flex flex-col flex-shrink-0 fixed h-full z-50`}
        style={{ boxShadow: '5px 0 15px rgba(163, 177, 198, 0.3)' }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center"
                style={{ boxShadow: '4px 4px 8px rgba(99, 102, 241, 0.3), -2px -2px 6px rgba(255, 255, 255, 0.8)' }}
              >
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashon</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-all"
            style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {/* Admin Section */}
        <div className="px-4 py-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {[
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/members', icon: UsersIcon, label: 'Team' },
            { path: '/attendance', icon: ClipboardList, label: 'Attendance' },
            { path: '/configuration', icon: Settings, label: 'Settings' }
          ].map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                isActive(path)
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              style={isActive(path)
                ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' }
                : { boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Profile Dropdown */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-200 transition-all"
              style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
            >
              <div 
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.4)' }}
              >
                <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </>
              )}
            </button>

            {showProfileDropdown && (
              <div 
                className="absolute bottom-full left-0 right-0 mb-2 bg-[#e8ecf3] rounded-2xl overflow-hidden"
                style={{ boxShadow: '8px 8px 20px rgba(163, 177, 198, 0.6), -8px -8px 20px rgba(255, 255, 255, 0.9)' }}
              >
                <button
                  onClick={() => { navigate('/profile'); setShowProfileDropdown(false); }}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-[#d4dae6] transition-colors"
                >
                  <UserCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">My Profile</span>
                </button>
                <button
                  onClick={handleDownloadTracker}
                  disabled={downloadingTracker}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-[#d4dae6] transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
                  </span>
                </button>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header 
          className="h-20 bg-[#e8ecf3] px-8 flex items-center justify-between flex-shrink-0"
          style={{ boxShadow: '0 4px 12px rgba(163, 177, 198, 0.3)' }}
        >
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{getPageSubtitle()}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2.5 bg-[#e8ecf3] rounded-2xl focus:outline-none text-sm text-gray-700"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
              />
            </div>

            <button 
              className="p-2.5 bg-[#e8ecf3] rounded-2xl hover:scale-105 transition-all"
              style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
            >
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>

            <button 
              className="relative p-2.5 bg-[#e8ecf3] rounded-2xl hover:scale-105 transition-all"
              style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div 
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-all"
              style={{ boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.7)' }}
              onClick={() => navigate('/profile')}
            >
              <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-[#e8ecf3] via-[#e8ecf3] to-[#d4dae6]">
          {children}
        </main>
      </div>
    </div>
  );
}
