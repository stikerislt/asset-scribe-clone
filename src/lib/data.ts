
import { useActivity, getActivityIcon } from "@/hooks/useActivity";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { AssetStatus, Asset as ApiAsset } from "@/lib/api/assets";

// Export AssetStatus from api/assets
export { AssetStatus } from "@/lib/api/assets";

// Define Asset type based on Supabase schema
export type Asset = ApiAsset;

// Define status color type
export type StatusColor = "green" | "yellow" | "red";

// Define Category type based on what we expect from Supabase
export interface Category {
  id: string;
  name: string;
  type: "asset" | "accessory" | "component" | "consumable" | "license";
  count: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Empty arrays instead of sample data
export const assets: Asset[] = [];

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

// Helper to check and debug asset access
export const debugAssetAccess = async () => {
  console.log("Debugging asset access...");
  try {
    const { data: session } = await supabase.auth.getSession();
    console.log("Current session:", session);
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .limit(5);
    
    console.log("Debug asset query result:", { data, error });
    return { data, error, isAuthenticated: !!session?.session };
  } catch (e) {
    console.error("Debug asset access error:", e);
    return { data: null, error: e, isAuthenticated: false };
  }
};

// Helper for working with category data from Supabase
export const fetchCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
    
    return data as Category[];
  } catch (error) {
    console.error("Error in fetchCategories:", error);
    throw error;
  }
};
