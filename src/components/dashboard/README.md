# Enhanced Dashboard Components

Advanced, animated dashboard components for the Workeye employee tracking system.

## Components Overview

### 1. AnimatedKPICard
Animated Key Performance Indicator cards with smooth number counting and hover effects.

```tsx
import { AnimatedKPICard } from './dashboard/AnimatedKPICard';
import { Users } from 'lucide-react';

<AnimatedKPICard
  title="Active Employees"
  value={42}
  icon={Users}
  color="green"
  trend={5.2}
  delay={0}
/>
```

**Props:**
- `title` (string): Card title
- `value` (number): Numeric value to display
- `suffix` (string, optional): Suffix for the value (e.g., "%", "h")
- `prefix` (string, optional): Prefix for the value (e.g., "$")
- `icon` (LucideIcon): Icon component from lucide-react
- `trend` (number, optional): Percentage trend (positive or negative)
- `color` (string, optional): Color theme - 'blue', 'green', 'orange', 'purple', 'red'
- `delay` (number, optional): Animation delay multiplier

### 2. ProductivityTimelineChart
Animated area chart showing activity over time with smooth transitions.

```tsx
import { ProductivityTimelineChart } from './dashboard/ProductivityTimelineChart';

const timelineData = [
  { time: '09:00', active: 45, idle: 10, locked: 5 },
  { time: '10:00', active: 52, idle: 5, locked: 3 },
  // ...
];

<ProductivityTimelineChart
  data={timelineData}
  title="Today's Activity Timeline"
  height={300}
/>
```

**Props:**
- `data` (TimelineData[]): Array of time-series data
- `title` (string, optional): Chart title
- `height` (number, optional): Chart height in pixels (default: 300)

### 3. VirtualizedActivityTable
Performance-optimized table with virtualization for large datasets (1000+ rows).

```tsx
import { VirtualizedActivityTable } from './dashboard/VirtualizedActivityTable';

const activityData = [
  {
    id: 'emp-1',
    name: 'John Doe',
    email: 'john@company.com',
    status: 'active',
    activeTime: 28800,
    idleTime: 1800,
    lockedTime: 600,
    lastActivity: new Date(),
    productivity: 87,
  },
  // ...
];

<VirtualizedActivityTable
  data={activityData}
  onRowClick={(row) => console.log('Clicked:', row)}
/>
```

**Props:**
- `data` (ActivityData[]): Array of employee activity data
- `onRowClick` (function, optional): Callback when a row is clicked

### 4. LiveAttendanceWidget
Real-time attendance tracking with live clock and recent check-in activity.

```tsx
import { LiveAttendanceWidget } from './dashboard/LiveAttendanceWidget';

const attendanceData = {
  totalEmployees: 50,
  present: 42,
  absent: 5,
  late: 3,
  recentCheckIns: [
    { id: '1', name: 'John Doe', time: new Date(), type: 'check-in' },
    // ...
  ],
};

<LiveAttendanceWidget data={attendanceData} />
```

**Props:**
- `data` (AttendanceData): Attendance statistics and recent activity

### 5. TopPerformersCard
Displays top performing employees with rankings and progress bars.

```tsx
import { TopPerformersCard } from './dashboard/TopPerformersCard';

const performers = [
  { 
    id: '1', 
    name: 'Sarah Chen', 
    productivity: 98, 
    activeHours: 8.5, 
    tasksCompleted: 24, 
    rank: 1 
  },
  // ...
];

<TopPerformersCard 
  performers={performers} 
  period="This Week"
/>
```

**Props:**
- `performers` (Performer[]): Array of top performers
- `period` (string, optional): Time period label

### 6. EnhancedDashboard
Complete dashboard layout integrating all components.

```tsx
import { EnhancedDashboard } from './dashboard/EnhancedDashboard';

// In your App.tsx or routing
<EnhancedDashboard />
```

## Installation

The required dependencies are already added to package.json. Run:

```bash
npm install
```

## Usage in Your Application

### Option 1: Use the Complete Enhanced Dashboard

Replace your existing Dashboard component:

```tsx
// In your App.tsx or routing file
import { EnhancedDashboard } from './components/dashboard/EnhancedDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<EnhancedDashboard />} />
        {/* other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Option 2: Use Individual Components

Integrate specific components into your existing dashboard:

```tsx
import { AnimatedKPICard } from './components/dashboard/AnimatedKPICard';
import { ProductivityTimelineChart } from './components/dashboard/ProductivityTimelineChart';
import { Users, Activity } from 'lucide-react';

function YourDashboard() {
  return (
    <div>
      {/* Add animated KPI cards */}
      <div className="grid grid-cols-4 gap-6">
        <AnimatedKPICard title="Active Users" value={42} icon={Users} color="green" />
        {/* more cards */}
      </div>
      
      {/* Add timeline chart */}
      <ProductivityTimelineChart data={yourData} />
    </div>
  );
}
```

## Customization

### Import Custom CSS

Add to your main CSS file or index.css:

```css
@import './styles/dashboard-animations.css';
```

### Modify Colors

Colors are based on Tailwind CSS. Update your `tailwind.config.js` to customize:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        // add custom colors
      },
    },
  },
};
```

### Adjust Animation Speed

Modify Framer Motion transition durations in component files:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }} // Adjust this
>
```

## Connecting to Your Backend

Replace sample data with your API calls:

```tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function YourDashboard() {
  const [activityData, setActivityData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get('/api/activity-log');
      setActivityData(response.data);
    };
    fetchData();
  }, []);
  
  return <VirtualizedActivityTable data={activityData} />;
}
```

## Performance Tips

1. **Use VirtualizedActivityTable for large datasets** (>100 rows)
2. **Memoize data transformations** with useMemo
3. **Implement pagination** for API calls
4. **Use React.memo** for components that don't need frequent re-renders
5. **Enable production build** for optimal performance

```bash
npm run build
```

## Features

- ✨ Smooth animations with Framer Motion
- 🎯 Number counting animations with React Spring
- 📊 Interactive charts with Recharts
- ⚡ Virtualized tables for performance
- 🎨 Beautiful gradient backgrounds
- 📱 Fully responsive design
- 🔔 Toast notifications with react-hot-toast
- 🎭 Hover effects and micro-interactions
- ⏱️ Real-time clock updates
- 🏆 Ranking system with visual indicators

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Animations not working?
- Ensure Framer Motion is installed: `npm install framer-motion`
- Check that animations are not disabled in browser settings

### Table not virtualizing?
- Verify parent container has a fixed height
- Ensure @tanstack/react-virtual is installed

### Charts not rendering?
- Make sure Recharts is installed: `npm install recharts`
- Check that data format matches expected interface

## License

Part of the Workeye project.