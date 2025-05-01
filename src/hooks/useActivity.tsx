import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Package, Users, Tag, AlertTriangle } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon?: React.ReactNode;
  category: 'asset' | 'user' | 'category' | 'license' | 'system';
  tenant_id?: string;
  user_id?: string;
  created_at?: string;
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
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const savedActivities = localStorage.getItem('activities');
    if (savedActivities) {
      const parsedActivities = JSON.parse(savedActivities);
      
      const filteredActivities = parsedActivities.filter((act: Activity) => {
        const userMatches = !act.user_id || act.user_id === user.id;
        const tenantMatches = !act.tenant_id || !currentTenant?.id || act.tenant_id === currentTenant?.id;
        
        return userMatches && tenantMatches;
      });

      const activitiesWithIcons = filteredActivities.map((activity: Partial<Activity>) => ({
        ...activity,
        icon: activity.category ? getActivityIcon(activity.category) : undefined
      }));
      
      setActivities(activitiesWithIcons);
    }
  }, [currentTenant?.id, user?.id]);

  useEffect(() => {
    if (!user) return;

    try {
      const savedActivities = localStorage.getItem('activities');
      let allActivities = savedActivities ? JSON.parse(savedActivities) : [];
      
      const currentActivitiesToStore = activities.map(({ icon, ...rest }) => rest);
      
      if (currentTenant?.id) {
        const otherActivities = allActivities.filter(
          (act: Activity) => 
            (act.tenant_id && act.tenant_id !== currentTenant.id) || 
            (act.user_id && act.user_id !== user.id)
        );
        
        allActivities = [...otherActivities, ...currentActivitiesToStore];
      } else {
        const otherUserActivities = allActivities.filter(
          (act: Activity) => act.user_id && act.user_id !== user.id
        );
        
        allActivities = [...otherUserActivities, ...currentActivitiesToStore];
      }
      
      localStorage.setItem('activities', JSON.stringify(allActivities));
    } catch (error) {
      console.error('Failed to save activities to localStorage:', error);
    }
  }, [activities, currentTenant?.id, user?.id]);

  const logActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    if (!user) return;

    const tenant_id = currentTenant?.id;
    const user_id = user?.id;
    
    const newActivity: Activity = {
      ...activity,
      tenant_id,
      user_id,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString()
    };

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
