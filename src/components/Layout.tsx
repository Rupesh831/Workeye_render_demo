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
  const [nameFilter, setNameFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = user?.full_name || company?.company_name || 'User';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Download tracker
  const handleDownloadTracker = async () => {
    try {
      setDownloadingTracker(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/tracker/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download tracker');
      }

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
    <div className="flex h-screen bg-gradient-to-br from-[#e8ecf3] via-[#e8ecf3] to-[#d4dae6] overflow-hidden">
      {/* Fixed Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#e8ecf3] transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 fixed h-full z-50`}
        style={{
          boxShadow: '5px 0 15px rgba(163, 177, 198, 0.3)',
        }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center"
                style={{
                  boxShadow: '4px 4px 8px rgba(99, 102, 241, 0.3), -2px -2px 6px rgba(255, 255, 255, 0.8)',
                }}
              >
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashon</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-all"
            style={{
              boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
            }}
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {/* Administrator Section */}
        {sidebarOpen && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/dashboard')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            style={isActive('/dashboard') 
              ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' } 
              : { boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Dashboard</span>}
          </button>

          <button
            onClick={() => navigate('/members')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/members')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            style={isActive('/members') 
              ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' } 
              : { boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }
            }
          >
            <UsersIcon className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Team</span>}
          </button>

          <button
            onClick={() => navigate('/attendance')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/attendance')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            style={isActive('/attendance') 
              ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' } 
              : { boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }
            }
          >
            <ClipboardList className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Attendance</span>}
          </button>

          <button
            onClick={() => navigate('/configuration')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/configuration')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            style={isActive('/configuration') 
              ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' } 
              : { boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }
            }
          >
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </button>
        </nav>

        {/* User Profile Dropdown */}
        <div className="p-4 flex-shrink-0 border-t border-gray-200">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-gray-200"
              style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </>
              )}
            </button>

            {showProfileDropdown && (
              <div 
                className="absolute bottom-full left-0 right-0 mb-2 bg-[#e8ecf3] rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '8px 8px 20px rgba(163, 177, 198, 0.6), -8px -8px 20px rgba(255, 255, 255, 0.9)',
                }}
              >
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-[#d4dae6]"
                >
                  <UserCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Profile</span>
                </button>
                <button
                  onClick={handleDownloadTracker}
                  disabled={downloadingTracker}
                  className="w-full px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-[#d4dae6]"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
                  </span>
                </button>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Bar */}
        <header 
          className="h-20 bg-[#e8ecf3] px-8 flex items-center justify-between flex-shrink-0"
          style={{
            boxShadow: '0 4px 12px rgba(163, 177, 198, 0.3)',
          }}
        >
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {location.pathname === '/dashboard' && 'Analytics Overview'}
              {location.pathname === '/members' && 'Team Management'}
              {location.pathname === '/attendance' && 'Attendance Records'}
              {location.pathname === '/configuration' && 'System Settings'}
              {location.pathname === '/profile' && 'My Profile'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {location.pathname === '/dashboard' && 'Track your team\'s performance'}
              {location.pathname === '/members' && 'Manage your team members'}
              {location.pathname === '/attendance' && 'View attendance history'}
              {location.pathname === '/configuration' && 'Configure your workspace'}
              {location.pathname === '/profile' && 'Manage your account'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-[#e8ecf3] rounded-2xl focus:outline-none transition-all text-sm text-gray-700"
                style={{
                  boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
                }}
              />
            </div>

            {/* Calendar */}
            <button 
              className="p-2.5 bg-[#e8ecf3] rounded-2xl transition-all hover:scale-105"
              style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
            >
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <button 
              className="relative p-2.5 bg-[#e8ecf3] rounded-2xl transition-all hover:scale-105"
              style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-lg"></span>
            </button>

            {/* User Avatar */}
            <div 
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.7)',
              }}
              onClick={() => navigate('/profile')}
            >
              <span className="text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
