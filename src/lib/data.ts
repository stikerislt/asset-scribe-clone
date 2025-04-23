import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

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

export const logActivity = async (
  userId: string,
  tenantId: string,
  activityType: string,
  description: string,
  metadata: any
): Promise<Activity | null> => {
  try {
    const { data, error } = await supabase
      .from("activity_log")
      .insert([
        {
          user_id: userId,
          tenant_id: tenantId,
          activity_type: activityType,
          description: description,
          metadata: metadata,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error);
      toast.error("Failed to log activity");
      return null;
    }

    return data as Activity;
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

// Fetch categories with tenant_id filter
export const fetchCategories = async (): Promise<Category[]> => {
  const { currentTenant } = useTenant();
  
  if (!currentTenant?.id) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', currentTenant.id)
    .order('name');
  
  if (error) {
    console.error("Error fetching categories:", error);
    toast.error("Failed to load categories");
    throw error;
  }
  
  return data || [];
};
