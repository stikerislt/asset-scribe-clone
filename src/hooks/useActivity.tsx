import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Package, Users, Tag, AlertTriangle } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon?: React.ReactNode;
  category: 'asset' | 'user' | 'category' | 'license' | 'system';
  tenant_id?: string; // Added tenant_id to track which tenant this activity belongs to
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
  const { currentTenant } = useTenant();

  // Load activities from localStorage on mount, filtering by current tenant
  useEffect(() => {
    try {
      // Get all saved activities
      const savedActivities = localStorage.getItem('activities');
      if (savedActivities) {
        // Parse activities
        const parsedActivities = JSON.parse(savedActivities);
        
        // Filter for current tenant if one is selected
        const filteredActivities = currentTenant?.id
          ? parsedActivities.filter((act: Activity) => !act.tenant_id || act.tenant_id === currentTenant.id)
          : parsedActivities;

        // Reassign icons based on category
        const activitiesWithIcons = filteredActivities.map((activity: Partial<Activity>) => ({
          ...activity,
          icon: activity.category ? getActivityIcon(activity.category) : undefined
        }));
        
        setActivities(activitiesWithIcons);
      }
    } catch (error) {
      console.error('Failed to load activities from localStorage:', error);
    }
  }, [currentTenant?.id]); // Re-run when tenant changes

  // Save activities to localStorage when they change
  useEffect(() => {
    try {
      // Get all existing activities
      const savedActivities = localStorage.getItem('activities');
      let allActivities = savedActivities ? JSON.parse(savedActivities) : [];
      
      // Remove icon before storing (can't serialize React elements)
      const currentActivitiesToStore = activities.map(({ icon, ...rest }) => rest);
      
      if (currentTenant?.id) {
        // For tenant-specific activities:
        // 1. Keep activities from other tenants
        const otherTenantActivities = allActivities.filter(
          (act: Activity) => act.tenant_id && act.tenant_id !== currentTenant.id
        );
        
        // 2. Replace current tenant's activities with the new set
        allActivities = [...otherTenantActivities, ...currentActivitiesToStore];
      } else {
        // If no tenant is selected, just store the current activities
        allActivities = currentActivitiesToStore;
      }
      
      // Store all activities
      localStorage.setItem('activities', JSON.stringify(allActivities));
    } catch (error) {
      console.error('Failed to save activities to localStorage:', error);
    }
  }, [activities, currentTenant?.id]);

  const logActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    // Ensure tenant_id is set if available
    const tenant_id = currentTenant?.id;
    
    const newActivity: Activity = {
      ...activity,
      tenant_id, // Add tenant_id to activity
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
