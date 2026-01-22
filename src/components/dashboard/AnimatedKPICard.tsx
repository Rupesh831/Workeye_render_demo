import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnimatedKPICardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: number;
  color?: string;
  delay?: number;
}

export const AnimatedKPICard = ({
  title,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  trend,
  color = 'blue',
  delay = 0,
}: AnimatedKPICardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  const springProps = useSpring({
    number: value,
    from: { number: 0 },
    config: { tension: 100, friction: 20 },
    delay: delay * 100,
  });

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }[color] || 'bg-blue-50 text-blue-600';

  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 }
      }}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <animated.div className="text-3xl font-bold text-gray-900">
            {springProps.number.to((n) => `${prefix}${Math.floor(n)}${suffix}`)}
          </animated.div>
          {trend !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay * 0.1 + 0.3 }}
              className={`flex items-center mt-2 text-sm ${trendColor}`}
            >
              <span className="font-semibold">
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </motion.div>
          )}
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: delay * 0.1 + 0.2 }}
          className={`p-3 rounded-lg ${colorClasses}`}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
};