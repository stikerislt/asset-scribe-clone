
import { supabase } from "@/integrations/supabase/client";

export interface Asset {
  id: string;
  name: string;
  tag: string;
  category: string;
  status: string;
  assigned_to: string | null;
  model?: string | null;
  serial?: string | null;
  purchase_date?: string | null;
  purchase_cost?: number | null;
  location?: string | null;
}

// Get assets by employee name
export const getAssetsByEmployeeName = async (employeeName: string): Promise<Asset[]> => {
  if (!employeeName) return [];
  
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('assigned_to', employeeName);
    
  if (error) throw error;
  return data || [];
};
