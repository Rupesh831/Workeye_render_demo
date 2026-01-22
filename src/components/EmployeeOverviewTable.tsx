// UPDATED: 2026-01-22 11:47 IST - Neumorphic table styling
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Eye, ArrowUpDown, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { formatLastActivity } from '../utils/timeUtils';

// Format time: show hours + minutes (e.g. "2h 30m" or "45m")
function formatTime(hours: number): string {
  if (hours === 0) return '0m';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface Employee {
  id: number;
  name: string;
  avatar: string;
  role: string;
  status: string;
  screenTime: number;
  activeTime: number;
  idleTime: number;
  lastActivity: string;
  productivity: number;
  screenshots: any[];
  screenshotsCount?: number;
}

interface EmployeeOverviewTableProps {
  employees: Employee[];
  onEmployeeClick: (employee: Employee) => void;
}

type SortField = 'name' | 'status' | 'screenTime' | 'activeTime' | 'idleTime' | 'productivity' | 'screenshots' | 'lastActivity';
type SortOrder = 'asc' | 'desc' | null;

export function EmployeeOverviewTable({ employees, onEmployeeClick }: EmployeeOverviewTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every 30 seconds to refresh "X mins ago" displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortOrder(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedEmployees = () => {
    if (!sortField || !sortOrder) return employees;

    return [...employees].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          const statusOrder = { active: 3, idle: 2, offline: 1 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'screenTime':
          aValue = a.screenTime;
          bValue = b.screenTime;
          break;
        case 'activeTime':
          aValue = a.activeTime;
          bValue = b.activeTime;
          break;
        case 'idleTime':
          aValue = a.idleTime;
          bValue = b.idleTime;
          break;
        case 'productivity':
          aValue = a.productivity;
          bValue = b.productivity;
          break;
        case 'screenshots':
          aValue = a.screenshotsCount || a.screenshots.length || 0;
          bValue = b.screenshotsCount || b.screenshots.length || 0;
          break;
        case 'lastActivity':
          aValue = a.lastActivity;
          bValue = b.lastActivity;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="w-4 h-4 text-indigo-600" />;
    }
    return <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  const sortedEmployees = getSortedEmployees();

  const getStatusBadge = (status: string) => {
    if (status === 'active') return 'neu-badge-success';
    if (status === 'idle') return 'neu-badge-warning';
    return 'neu-badge-danger';
  };

  const handleViewDetails = (employee: Employee) => {
    onEmployeeClick(employee);
  };

  const handleViewAnalytics = (employee: Employee) => {
    navigate(`/analytics?memberId=${employee.id}`);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="neu-table">
        <thead>
          <tr>
            <th>
              <button
                onClick={() => handleSort('name')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Employee
                <SortIcon field="name" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('status')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Status
                <SortIcon field="status" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('screenTime')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Screen Time
                <SortIcon field="screenTime" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('activeTime')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Active Time
                <SortIcon field="activeTime" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('idleTime')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Idle Time
                <SortIcon field="idleTime" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('productivity')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Productivity
                <SortIcon field="productivity" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('screenshots')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Screenshots
                <SortIcon field="screenshots" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('lastActivity')}
                className="neu-btn-sm"
                style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
              >
                Last Activity
                <SortIcon field="lastActivity" />
              </button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedEmployees.map((employee) => {
            const productivity = Math.round(employee.productivity);
            const screenshotCount = employee.screenshotsCount || employee.screenshots?.length || 0;

            return (
              <tr key={employee.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(145deg, #7477ff, #5558d9)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontWeight: 700,
                      fontSize: '16px'
                    }}>
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="neu-title" style={{ fontSize: '14px', marginBottom: '2px' }}>{employee.name}</div>
                      <div className="neu-text-muted" style={{ fontSize: '12px' }}>{employee.role}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`neu-badge ${getStatusBadge(employee.status)}`}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', marginRight: '6px', background: 'currentColor' }}></span>
                    {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <span className="neu-title" style={{ fontSize: '14px' }}>{formatTime(employee.screenTime)}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>{formatTime(employee.activeTime)}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>{formatTime(employee.idleTime)}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="neu-progress" style={{ width: '100px' }}>
                      <div
                        className="neu-progress-fill"
                        style={{ width: `${productivity}%` }}
                      ></div>
                    </div>
                    <span className="neu-title" style={{ fontSize: '14px', minWidth: '40px' }}>{productivity}%</span>
                  </div>
                </td>
                <td>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    background: 'linear-gradient(145deg, #e9d5ff, #ddd6fe)', 
                    color: '#6b21a8', 
                    fontSize: '13px', 
                    fontWeight: 700 
                  }}>
                    {screenshotCount}
                  </span>
                </td>
                <td>
                  <span className="neu-text-muted" style={{ fontSize: '13px' }}>{formatLastActivity(employee.lastActivity)}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleViewDetails(employee)}
                      className="neu-btn-sm"
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleViewAnalytics(employee)}
                      className="neu-btn-sm active"
                    >
                      <BarChart3 style={{ width: '14px', height: '14px' }} />
                      <span>Chart</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {employees.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="neu-title" style={{ fontSize: '18px', marginBottom: '8px' }}>No employees found</p>
          <p className="neu-text-muted">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
