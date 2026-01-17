/**
 * StatusBadge.tsx - Member Status Badge Component
 * ==============================================
 * Shows visual status badge (Active/Idle/Offline)
 */

import { MemberStatus } from '../hooks/useRealTimeStatus';

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      label: 'Active',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      dotColor: 'bg-green-500',
      pulse: true
    },
    idle: {
      label: 'Idle',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      dotColor: 'bg-yellow-500',
      pulse: false
    },
    offline: {
      label: 'Offline',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      dotColor: 'bg-gray-400',
      pulse: false
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dotColor} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
      />
      {config.label}
    </span>
  );
}
