
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

export type StatusColor = "green" | "yellow" | "red" | null;

export interface Activity {
  id: string;
  timestamp: string;
  user_id: string;
  tenant_id: string;
  activity_type: string;
  description: string;
  metadata: any;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  icon: string;
  count: number;
  user_id: string;
  tenant_id: string;
}

// Modified to use asset_history table instead of activity_log
export const logActivity = async (
  userId: string,
  tenantId: string,
  activityType: string,
  description: string,
  metadata: any
): Promise<Activity | null> => {
  try {
    // Using asset_history table which exists in the database
    // Generate a placeholder asset_id since it's required
    const placeholderAssetId = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from("asset_history")
      .insert([
        {
          asset_id: placeholderAssetId, // Required field for asset_history
          user_id: userId,
          tenant_id: tenantId,
          field_name: activityType,  // Mapping activity_type to field_name
          new_value: description,    // Mapping description to new_value
          old_value: JSON.stringify(metadata)  // Storing metadata as a string in old_value
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error);
      toast.error("Failed to log activity");
      return null;
    }

    // Convert asset_history data structure to Activity interface
    const activity: Activity = {
      id: data.id,
      timestamp: data.created_at,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      activity_type: data.field_name,
      description: data.new_value,
      metadata: data.old_value ? JSON.parse(data.old_value) : null
    };

    return activity;
  } catch (error) {
    console.error("Error logging activity:", error);
    toast.error("Failed to log activity");
    return null;
  }
};

export const logCategoryActivity = async (
  activityType: string,
  category: Category
): Promise<void> => {
  const description = `Category ${activityType.toLowerCase()} "${category.name}"`;
  await logActivity(
    category.user_id,
    category.tenant_id,
    `Category ${activityType}`,
    description,
    category
  );
};

// Modified function to fetch categories from the database
export const fetchCategories = async (tenantId: string): Promise<Category[]> => {
  if (!tenantId) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  
  if (error) {
    console.error("Error fetching categories:", error);
    toast.error("Failed to load categories");
    throw error;
  }
  
  return data || [];
};

// New function to normalize category names for comparison
export const normalizeCategoryName = (name: string): string => {
  return name.trim().toLowerCase();
};
