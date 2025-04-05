
import { supabase } from "@/integrations/supabase/client";
import { AssetStatus, StatusColor } from "@/lib/data";

export interface Asset {
  id: string;
  name: string;
  tag: string;
  category: string;
  status: AssetStatus;
  status_color: StatusColor | null;
  assigned_to: string | null;
  model: string | null;
  serial: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  location: string | null;
  notes: string | null;
  wear: string | null; // Added wear field
  qty: number | null; // Added quantity field
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Valid status values for validation
export const VALID_ASSET_STATUSES: AssetStatus[] = [
  'ready', 
  'deployed', 
  'maintenance', 
  'retired'
];

// Get assets by employee name
export const getAssetsByEmployeeName = async (employeeName: string): Promise<Asset[]> => {
  if (!employeeName) return [];
  
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('assigned_to', employeeName);
    
  if (error) throw error;
  
  // Ensure asset status is properly typed
  return (data || []).map(asset => ({
    ...asset,
    status: asset.status as AssetStatus,
    status_color: asset.status_color as StatusColor | null,
    location: asset.location || null,
    notes: asset.notes || null,
    wear: asset.wear || null, // Handle wear field - safely handle if not present in DB yet
    qty: asset.qty || 1 // Default quantity to 1 if not specified
  }));
};
