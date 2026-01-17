import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AttendanceDetailView } from './AttendanceDetailView';
import { dashboard } from '../config/api';

interface Member {
  id: number;
  name: string;
  email?: string;
  position?: string;
}

export function AttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await dashboard.getStats();
        
        if (response.success && response.members) {
          const found = response.members.find(m => m.id === parseInt(id));
          if (found) {
            setMember({
              id: found.id,
              name: found.name,
              email: found.email,
              position: found.position
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch member:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Member not found</p>
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
    <AttendanceDetailView
      member={member}
      onBack={() => navigate('/dashboard')}
    />
  );
}
