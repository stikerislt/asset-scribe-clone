
import { useActivity, getActivityIcon } from "@/hooks/useActivity";

export interface Asset {
  id: string;
  name: string;
  tag: string;
  serial: string;
  model: string;
  category: string;
  status: "ready" | "assigned" | "pending" | "archived" | "broken";
  assignedTo?: string;
  purchaseDate: string;
  purchaseCost: string;
  location: string;
}

export interface Category {
  id: string;
  name: string;
  type: "asset" | "accessory" | "component" | "consumable" | "license";
  count: number;
}

// Empty arrays instead of sample data
export const assets: Asset[] = [];
export const categories: Category[] = [];

// Helper to log asset activities
export const logAssetActivity = (
  action: string, 
  asset: Partial<Asset>, 
  useActivityHook = useActivity
) => {
  const { logActivity } = useActivityHook();
  
  logActivity({
    title: action,
    description: `${asset.name || 'Asset'} ${action.toLowerCase()}`,
    category: 'asset',
    icon: getActivityIcon('asset')
  });
};

// Helper to log category activities
export const logCategoryActivity = (
  action: string, 
  category: Partial<Category>,
  useActivityHook = useActivity
) => {
  const { logActivity } = useActivityHook();
  
  logActivity({
    title: `Category ${action}`,
    description: `${category.name || 'Category'} ${action.toLowerCase()}`,
    category: 'category',
    icon: getActivityIcon('category')
  });
};

// Helper to log user activities
export const logUserActivity = (
  action: string,
  user: { name: string },
  useActivityHook = useActivity
) => {
  const { logActivity } = useActivityHook();
  
  logActivity({
    title: `User ${action}`,
    description: `${user.name} ${action.toLowerCase()}`,
    category: 'user',
    icon: getActivityIcon('user')
  });
};
