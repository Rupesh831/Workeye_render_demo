import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EmployeeDetailView } from './EmployeeDetailView';
import { dashboard } from '../config/api';

interface Employee {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: 'active' | 'idle' | 'offline';
  screenTime: number;
  activeTime: number;
  idleTime: number;
  lastActivity: string;
  productivity: number;
  screenshots: any[];
  screenshotsCount?: number;
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await dashboard.getStats();
        
        if (response.success && response.members) {
          const found = response.members.find(m => m.id === parseInt(id));
          if (found) {
            // Transform the member data to match Employee interface
            setEmployee({
              id: found.id,
              name: found.name,
              email: found.email,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(found.name)}&background=3b82f6&color=fff`,
              role: found.position || 'Employee',
              status: found.status,
              screenTime: found.screen_time || 0,
              activeTime: found.active_time || 0,
              idleTime: found.idle_time || 0,
              lastActivity: found.last_activity_at || '',
              productivity: found.productivity || 0,
              screenshots: [],
              screenshotsCount: found.screenshots_count || 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch employee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Employee not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <EmployeeDetailView
      employee={employee}
      onBack={() => navigate('/dashboard')}
    />
  );
}
