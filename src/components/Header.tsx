import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Download } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuth } from '../contexts/AuthContext';
import { tracker } from '../config/api';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout } = useAuth();
  const [downloadingTracker, setDownloadingTracker] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDownloadTracker = async () => {
    try {
      setDownloadingTracker(true);
      await tracker.download();
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err?.message || 'Failed to download tracker');
    } finally {
      setDownloadingTracker(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                WorkEye
              </h1>
              <p className="text-xs text-slate-500">
                {company?.company_name || 'Employee Monitor'}
              </p>
            </div>
          </div>

          {/* Navigation Links - Hidden on mobile, shown on tablet+ */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/attendance')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => navigate('/members')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/members')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => navigate('/configuration')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/configuration')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Configuration
            </button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Download Tracker Button */}
            <button
              onClick={handleDownloadTracker}
              disabled={downloadingTracker}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Download Tracker"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">
                {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
              </span>
            </button>

            {/* Mobile Download Button - Icon Only */}
            <button
              onClick={handleDownloadTracker}
              disabled={downloadingTracker}
              className="sm:hidden p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
              title="Download Tracker"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            <ProfileDropdown
              adminName={user?.full_name || 'Admin'}
              adminRole={user?.role || 'Administrator'}
              companyName={company?.company_name || 'Company'}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
