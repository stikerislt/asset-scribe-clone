
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Package, Users, Tag, AlertTriangle } from 'lucide-react';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon?: React.ReactNode;
  category: 'asset' | 'user' | 'category' | 'license' | 'system';
}

interface ActivityContextType {
  activities: Activity[];
  logActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const formatTimestamp = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();
  return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
};

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load activities from localStorage on mount
  useEffect(() => {
    try {
      const savedActivities = localStorage.getItem('activities');
      if (savedActivities) {
        // Parse activities but don't try to parse the icon
        const parsedActivities = JSON.parse(savedActivities);
        // Reassign icons based on category
        const activitiesWithIcons = parsedActivities.map((activity: Partial<Activity>) => ({
          ...activity,
          icon: activity.category ? getActivityIcon(activity.category) : undefined
        }));
        setActivities(activitiesWithIcons);
      }
    } catch (error) {
      console.error('Failed to load activities from localStorage:', error);
    }
  }, []);

  // Save activities to localStorage when they change
  useEffect(() => {
    try {
      // Remove icon before storing (can't serialize React elements)
      const activitiesForStorage = activities.map(({ icon, ...rest }) => rest);
      localStorage.setItem('activities', JSON.stringify(activitiesForStorage));
    } catch (error) {
      console.error('Failed to save activities to localStorage:', error);
    }
  }, [activities]);

  const logActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Prepend new activity to the list and keep only the latest 20 activities
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
  };

  const clearActivities = () => {
    setActivities([]);
  };

  return (
    <ActivityContext.Provider value={{ activities, logActivity, clearActivities }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

// Icon helpers for common activity types
export const getActivityIcon = (category: Activity['category']) => {
  switch (category) {
    case 'asset':
      return <Package className="h-5 w-5 text-blue-600" />;
    case 'user':
      return <Users className="h-5 w-5 text-green-600" />;
    case 'category':
      return <Tag className="h-5 w-5 text-purple-600" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }
};
