import { useState } from 'react';
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
      return <ArrowUp className="w-4 h-4 text-blue-600" />;
    }
    return <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const sortedEmployees = getSortedEmployees();

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-700 border-green-200',
      idle: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      offline: 'bg-slate-200 text-slate-700 border-slate-300'
    };
    return badges[status as keyof typeof badges] || badges.offline;
  };

  const handleViewDetails = (employee: Employee) => {
    onEmployeeClick(employee);
  };

  const handleViewAnalytics = (employee: Employee) => {
    navigate(`/analytics?memberId=${employee.id}`);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Employee
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('screenTime')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Screen Time
                  <SortIcon field="screenTime" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('activeTime')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Active Time
                  <SortIcon field="activeTime" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('idleTime')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Idle Time
                  <SortIcon field="idleTime" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('productivity')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Productivity
                  <SortIcon field="productivity" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('screenshots')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Screenshots
                  <SortIcon field="screenshots" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('lastActivity')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                >
                  Last Activity
                  <SortIcon field="lastActivity" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedEmployees.map((employee) => {
              const productivity = Math.round(employee.productivity);
              const screenshotCount = employee.screenshotsCount || employee.screenshots?.length || 0;

              return (
                <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{employee.name}</div>
                        <div className="text-sm text-slate-500">{employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(employee.status)}`}>
                      <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{
                        backgroundColor: employee.status === 'active' ? '#10b981' : employee.status === 'idle' ? '#f59e0b' : '#6b7280'
                      }}></span>
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{formatTime(employee.screenTime)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-semibold text-green-600">{formatTime(employee.activeTime)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="font-semibold text-yellow-600">{formatTime(employee.idleTime)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${productivity}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 min-w-[40px]">{productivity}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium">
                      {screenshotCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{formatLastActivity(employee.lastActivity)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(employee)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => handleViewAnalytics(employee)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Analytics</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {employees.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">No employees found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
