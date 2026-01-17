import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  Building2, 
  LogOut, 
  Settings, 
  Users, 
  Clock,
  UserCircle
} from 'lucide-react';

interface ProfileDropdownProps {
  adminName: string;
  adminRole: string;
  companyName: string;
  onLogout: () => void;
}

export function ProfileDropdown({ adminName, adminRole, companyName, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
          {getInitials(adminName)}
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-slate-600 transition-transform duration-300 hidden sm:block ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`} 
        />
      </button>

      {/* Dropdown Menu - Smooth slide animation */}
      <div 
        className={`absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 ease-out origin-top ${
          isOpen 
            ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
        }`}
        style={{ 
          transformOrigin: 'top',
          zIndex: 50
        }}
      >
        <div className="py-2">
          {/* Profile Info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-semibold shadow-md flex-shrink-0">
                {getInitials(adminName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{adminName}</p>
                <p className="text-xs text-slate-500 truncate">{adminRole}</p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{companyName}</span>
            </div>
          </div>

          {/* Navigation Menu Items */}
          <div className="px-2 py-2 space-y-1">
            {/* Profile */}
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>My Profile</span>
            </button>

            {/* Add Members */}
            <button
              onClick={() => handleNavigation('/members')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Add Members</span>
            </button>

            {/* Attendance */}
            <button
              onClick={() => handleNavigation('/attendance')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Attendance</span>
            </button>

            {/* Configuration */}
            <button
              onClick={() => handleNavigation('/configuration')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Configuration</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="px-2 py-2 border-t border-slate-100 mt-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
