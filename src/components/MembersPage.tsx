import { useAuth } from '../contexts/AuthContext';
import { MembersManagement } from './MembersManagement';

export function MembersPage() {
  const { company } = useAuth();

  return (
    <MembersManagement 
      companyUsername={company?.company_username || ''} 
      companyId={company?.id || 0}
      onMembersUpdate={() => {}}
    />
  );
}
