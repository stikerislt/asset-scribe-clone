
import { Package, Users, Tag, Clock } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Link } from "react-router-dom";
import { useActivity } from "@/hooks/useActivity";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { activities } = useActivity();
  const { user } = useAuth();
  
  const { data: assetCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['asset-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching asset count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user
  });

  // In a real app, these would also be from Supabase
  const userCount = 0;
  const categoryCount = 0;
  const dueCount = 0;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/assets" className="block">
          <StatsCard
            title="Total Assets"
            value={countLoading ? "..." : assetCount.toString()}
            icon={<Package className="h-5 w-5" />}
            description={`${assetCount > 0 ? 'Manage your assets' : 'No assets yet'}`}
          />
        </Link>
        <Link to="/users" className="block">
          <StatsCard
            title="Users"
            value={userCount.toString()}
            icon={<Users className="h-5 w-5" />}
            description={`${userCount > 0 ? 'Manage your users' : 'No users yet'}`}
          />
        </Link>
        <Link to="/categories" className="block">
          <StatsCard
            title="Categories"
            value={categoryCount.toString()}
            icon={<Tag className="h-5 w-5" />}
          />
        </Link>
        <StatsCard
          title="Assets Due"
          value={dueCount.toString()}
          icon={<Clock className="h-5 w-5" />}
          description="Assets due for check-in"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        {activities.length > 0 ? (
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  description={activity.description}
                  timestamp={activity.timestamp}
                  icon={activity.icon ? renderActivityIcon(activity.icon) : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No recent activity to display</p>
            <p className="text-sm text-gray-400 mt-1">Activities will appear here as you make changes</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to render activity icons safely
const renderActivityIcon = (icon: React.ReactNode) => {
  // If icon is already a valid ReactNode, return it
  return icon;
};

interface ActivityItemProps {
  title: string;
  description: string;
  timestamp: string;
  icon?: React.ReactNode;
}

const ActivityItem = ({ title, description, timestamp, icon }: ActivityItemProps) => (
  <div className="flex items-start space-x-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
    <div className="bg-blue-100 p-2 rounded-full">
      {icon || <Package className="h-5 w-5 text-blue-600" />}
    </div>
    <div className="flex-1">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <div className="text-xs text-gray-500">{timestamp}</div>
  </div>
);

export default Dashboard;
