/**
 * ProductivityBar.tsx - Productivity Percentage Bar
 * ================================================
 * Visual bar showing productivity percentage
 */

interface ProductivityBarProps {
  percentage: number;
  className?: string;
}

export function ProductivityBar({ percentage, className = '' }: ProductivityBarProps) {
  // Clamp percentage between 0-100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Determine color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 80) return { bg: 'bg-green-500', text: 'text-green-700' };
    if (pct >= 60) return { bg: 'bg-blue-500', text: 'text-blue-700' };
    if (pct >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-700' };
    if (pct >= 20) return { bg: 'bg-orange-500', text: 'text-orange-700' };
    return { bg: 'bg-red-500', text: 'text-red-700' };
  };
  
  const colors = getColor(clampedPercentage);
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Progress Bar */}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bg} transition-all duration-500`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      
      {/* Percentage Text */}
      <span className={`text-sm font-semibold ${colors.text} min-w-[3rem] text-right`}>
        {clampedPercentage}%
      </span>
    </div>
  );
}
