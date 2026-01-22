import { motion } from 'framer-motion';
import { Users, Activity, Clock, TrendingUp } from 'lucide-react';
import { AnimatedKPICard } from './AnimatedKPICard';
import { ProductivityTimelineChart } from './ProductivityTimelineChart';
import { VirtualizedActivityTable } from './VirtualizedActivityTable';
import { LiveAttendanceWidget } from './LiveAttendanceWidget';
import { TopPerformersCard } from './TopPerformersCard';
import { Toaster } from 'react-hot-toast';

// Sample data - replace with actual API calls
const sampleTimelineData = [
  { time: '09:00', active: 45, idle: 10, locked: 5 },
  { time: '10:00', active: 52, idle: 5, locked: 3 },
  { time: '11:00', active: 48, idle: 8, locked: 4 },
  { time: '12:00', active: 30, idle: 20, locked: 10 },
  { time: '13:00', active: 55, idle: 3, locked: 2 },
  { time: '14:00', active: 50, idle: 7, locked: 3 },
  { time: '15:00', active: 47, idle: 10, locked: 3 },
  { time: '16:00', active: 42, idle: 12, locked: 6 },
];

const sampleActivityData = Array.from({ length: 50 }, (_, i) => ({
  id: `emp-${i}`,
  name: `Employee ${i + 1}`,
  email: `employee${i + 1}@company.com`,
  status: ['active', 'idle', 'locked', 'offline'][Math.floor(Math.random() * 4)] as any,
  activeTime: Math.floor(Math.random() * 28800),
  idleTime: Math.floor(Math.random() * 3600),
  lockedTime: Math.floor(Math.random() * 1800),
  lastActivity: new Date(),
  productivity: Math.floor(Math.random() * 40) + 60,
}));

const sampleAttendanceData = {
  totalEmployees: 50,
  present: 42,
  absent: 5,
  late: 3,
  recentCheckIns: [
    { id: '1', name: 'John Doe', time: new Date(), type: 'check-in' as const },
    { id: '2', name: 'Jane Smith', time: new Date(), type: 'check-in' as const },
    { id: '3', name: 'Mike Johnson', time: new Date(), type: 'check-out' as const },
  ],
};

const samplePerformers = [
  { id: '1', name: 'Sarah Chen', productivity: 98, activeHours: 8.5, tasksCompleted: 24, rank: 1 },
  { id: '2', name: 'Alex Kumar', productivity: 95, activeHours: 8.2, tasksCompleted: 22, rank: 2 },
  { id: '3', name: 'Emily Rodriguez', productivity: 92, activeHours: 8.0, tasksCompleted: 20, rank: 3 },
  { id: '4', name: 'James Wilson', productivity: 88, activeHours: 7.8, tasksCompleted: 18, rank: 4 },
  { id: '5', name: 'Maria Garcia', productivity: 85, activeHours: 7.5, tasksCompleted: 17, rank: 5 },
];

export const EnhancedDashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Workeye Dashboard
        </h1>
        <p className="text-gray-600">Real-time employee activity monitoring</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedKPICard
            title="Active Employees"
            value={42}
            icon={Users}
            color="green"
            trend={5.2}
            delay={0}
          />
          <AnimatedKPICard
            title="Avg Productivity"
            value={87}
            suffix="%"
            icon={TrendingUp}
            color="blue"
            trend={3.1}
            delay={1}
          />
          <AnimatedKPICard
            title="Total Hours Today"
            value={328}
            suffix="h"
            icon={Clock}
            color="purple"
            trend={-1.5}
            delay={2}
          />
          <AnimatedKPICard
            title="Attendance Rate"
            value={84}
            suffix="%"
            icon={Activity}
            color="orange"
            trend={2.3}
            delay={3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <ProductivityTimelineChart
              data={sampleTimelineData}
              title="Today's Activity Timeline"
            />
            <VirtualizedActivityTable
              data={sampleActivityData}
              onRowClick={(row) => console.log('Clicked:', row)}
            />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <LiveAttendanceWidget data={sampleAttendanceData} />
            <TopPerformersCard performers={samplePerformers} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};