import { useAuth } from '../contexts/AuthContext';
import { MembersManagement } from './MembersManagement';

export function MembersPage() {
  const { company } = useAuth();

  return (
    <div className="p-6">
      <div 
        className="bg-[#e8ecf3] rounded-3xl overflow-hidden"
        style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
      >
        <MembersManagement 
          companyUsername={company?.company_username || ''} 
          companyId={company?.id || 0}
          onMembersUpdate={() => {}}
        />
      </div>
    </div>
  );
}
