# 🚀 Enhanced Dashboard Setup Guide

## Quick Start

Your Workeye frontend now has advanced animated dashboard components! Follow these steps to use them.

## 📦 Installation

All dependencies have been added. Install them:

```bash
cd /path/to/your/frontend
npm install
```

## 🎯 Option 1: Use the Complete Enhanced Dashboard

### Step 1: Import the Enhanced Dashboard

In your `src/App.tsx`, add a route for the enhanced dashboard:

```tsx
import { EnhancedDashboard } from './components/dashboard/EnhancedDashboard';
import { Dashboard } from './components/Dashboard'; // Your existing dashboard

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Your existing dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* NEW: Enhanced animated dashboard */}
        <Route path="/dashboard-enhanced" element={<EnhancedDashboard />} />
        
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 2: Add CSS animations

Add this line to your `src/index.css` at the top:

```css
@import './styles/dashboard-animations.css';
```

### Step 3: Visit the Enhanced Dashboard

Navigate to `http://localhost:5173/dashboard-enhanced` to see it in action!

## 🧩 Option 2: Add Components to Existing Dashboard

You can integrate individual components into your current Dashboard.tsx:

```tsx
// In your existing Dashboard.tsx
import { AnimatedKPICard } from './dashboard/AnimatedKPICard';
import { ProductivityTimelineChart } from './dashboard/ProductivityTimelineChart';
import { LiveAttendanceWidget } from './dashboard/LiveAttendanceWidget';
import { Users, Activity, Clock, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  // Your existing state and logic...
  
  return (
    <div className="p-6">
      {/* Replace your existing KPI cards with animated ones */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <AnimatedKPICard
          title="Active Employees"
          value={activeEmployees}
          icon={Users}
          color="green"
          trend={5.2}
        />
        <AnimatedKPICard
          title="Avg Productivity"
          value={avgProductivity}
          suffix="%"
          icon={TrendingUp}
          color="blue"
        />
        {/* Add more cards */}
      </div>
      
      {/* Add the timeline chart */}
      <ProductivityTimelineChart data={yourTimelineData} />
      
      {/* Rest of your existing dashboard */}
    </div>
  );
};
```

## 🔌 Connecting to Your Backend

### Example: Fetch Activity Data

```tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { VirtualizedActivityTable } from './dashboard/VirtualizedActivityTable';

function YourDashboard() {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/activity-log`);
        
        // Transform your API data to match component interface
        const transformedData = response.data.map(item => ({
          id: item.id.toString(),
          name: item.username,
          email: item.email,
          status: item.is_idle ? 'idle' : item.locked ? 'locked' : 'active',
          activeTime: item.active_seconds,
          idleTime: item.idle_seconds,
          lockedTime: item.locked_seconds,
          lastActivity: new Date(item.last_activity),
          productivity: Math.round((item.active_seconds / item.total_seconds) * 100),
        }));
        
        setActivityData(transformedData);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityData();
    
    // Optional: Poll for updates every 30 seconds
    const interval = setInterval(fetchActivityData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return <VirtualizedActivityTable data={activityData} />;
}
```

### Example: Real-time Updates with WebSocket

```tsx
import { useEffect, useState } from 'react';

function DashboardWithRealtime() {
  const [activityData, setActivityData] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket('ws://your-backend-url/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setActivityData(data);
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <div>
      <VirtualizedActivityTable data={activityData} />
    </div>
  );
}
```

## 🎨 Customization

### Change Colors

Modify colors in component props:

```tsx
<AnimatedKPICard
  color="green"  // Options: blue, green, orange, purple, red
  // ...
/>
```

### Adjust Animation Speed

Edit the transition duration in components:

```tsx
// In any component file
transition={{ duration: 0.5 }}  // Change to 0.3 for faster, 1.0 for slower
```

### Modify Chart Colors

In `ProductivityTimelineChart.tsx`, change the gradient colors:

```tsx
<linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />  {/* Change color here */}
</linearGradient>
```

## 📡 API Integration Example

Create a service file for API calls:

```tsx
// src/services/dashboardService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const dashboardService = {
  async getActivityLog() {
    const response = await axios.get(`${API_URL}/api/activity-log`);
    return response.data;
  },
  
  async getAttendance() {
    const response = await axios.get(`${API_URL}/api/attendance/today`);
    return response.data;
  },
  
  async getTopPerformers() {
    const response = await axios.get(`${API_URL}/api/analytics/top-performers`);
    return response.data;
  },
};
```

## 📊 Data Format Examples

### Timeline Data
```typescript
const timelineData = [
  { time: '09:00', active: 45, idle: 10, locked: 5 },
  { time: '10:00', active: 52, idle: 5, locked: 3 },
  // ...
];
```

### Activity Data
```typescript
const activityData = [
  {
    id: 'emp-1',
    name: 'John Doe',
    email: 'john@company.com',
    status: 'active', // 'active' | 'idle' | 'locked' | 'offline'
    activeTime: 28800, // in seconds
    idleTime: 1800,
    lockedTime: 600,
    lastActivity: new Date(),
    productivity: 87, // percentage
  },
];
```

### Attendance Data
```typescript
const attendanceData = {
  totalEmployees: 50,
  present: 42,
  absent: 5,
  late: 3,
  recentCheckIns: [
    { 
      id: '1', 
      name: 'John Doe', 
      time: new Date(), 
      type: 'check-in' // or 'check-out'
    },
  ],
};
```

## ⚡ Performance Tips

1. **Use memoization** for expensive calculations:
```tsx
import { useMemo } from 'react';

const sortedData = useMemo(() => 
  data.sort((a, b) => b.productivity - a.productivity),
  [data]
);
```

2. **Implement pagination** for large datasets
3. **Use React.memo** for static components
4. **Enable production build**:
```bash
npm run build
```

## 🐛 Troubleshooting

### Issue: "Module not found" errors
**Solution:** Run `npm install` to install all dependencies

### Issue: Animations not smooth
**Solution:** Enable GPU acceleration in your CSS:
```css
.animated-element {
  transform: translateZ(0);
  will-change: transform;
}
```

### Issue: Table performance issues
**Solution:** Use the VirtualizedActivityTable for datasets > 100 rows

### Issue: Charts not rendering
**Solution:** Ensure your data matches the expected format (see examples above)

## 🎉 What's New

✅ Smooth animations with Framer Motion  
✅ Number counting effects with React Spring  
✅ Virtualized tables for performance  
✅ Interactive charts with Recharts  
✅ Real-time clock updates  
✅ Beautiful gradient backgrounds  
✅ Hover effects and micro-interactions  
✅ Toast notifications  
✅ Top performers ranking system  
✅ Live attendance tracking  
✅ Fully responsive design  

## 📚 Additional Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [React Spring Docs](https://www.react-spring.dev/)
- [Recharts Docs](https://recharts.org/)
- [TanStack Virtual Docs](https://tanstack.com/virtual/latest)

## 💬 Need Help?

Check the `src/components/dashboard/README.md` for detailed component documentation.

---

**Happy coding! 🚀**