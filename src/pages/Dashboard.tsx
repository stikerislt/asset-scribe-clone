
import { Package, Users, Tag, Clock, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Assets"
          value="1,256"
          icon={<Package className="h-5 w-5" />}
          description="12 new assets this month"
        />
        <StatsCard
          title="Users"
          value="342"
          icon={<Users className="h-5 w-5" />}
          description="5 new users this month"
        />
        <StatsCard
          title="Categories"
          value="24"
          icon={<Tag className="h-5 w-5" />}
        />
        <StatsCard
          title="Assets Due"
          value="8"
          icon={<Clock className="h-5 w-5" />}
          description="Assets due for check-in"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="space-y-4">
            <ActivityItem
              title="New Laptop Assigned"
              description="MacBook Pro 16" assigned to Sarah Johnson"
              timestamp="10 minutes ago"
            />
            <ActivityItem
              title="License Expired"
              description="Adobe Creative Cloud license has expired"
              timestamp="2 hours ago"
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            />
            <ActivityItem
              title="Component Check-out"
              description="8GB RAM module checked out by IT Department"
              timestamp="Yesterday"
            />
            <ActivityItem
              title="New Asset Added"
              description="iPhone 14 Pro added to inventory"
              timestamp="2 days ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
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
