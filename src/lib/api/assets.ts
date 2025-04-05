
import { supabase } from "@/integrations/supabase/client";
import { StatusColor } from "@/lib/data";

// Define valid asset statuses
export type AssetStatus = 'ready' | 'deployed' | 'maintenance' | 'retired' | 'assigned' | 'pending' | 'archived' | 'broken';

export interface Asset {
  id: string;
  name: string;
  tag: string;
  category: string;
  categoryIcon?: string;  // Added this property
  status: AssetStatus;
  status_color: StatusColor | null;
  assigned_to: string | null;
  model: string | null;
  serial: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  location: string | null;
  notes: string | null;
  wear: string | null;
  qty: number | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Valid status values for validation
export const VALID_ASSET_STATUSES: AssetStatus[] = [
  'ready', 
  'deployed', 
  'maintenance', 
  'retired',
  'assigned',
  'pending',
  'archived',
  'broken'
];

// Get assets by employee name
export const getAssetsByEmployeeName = async (employeeName: string): Promise<Asset[]> => {
  if (!employeeName) return [];
  
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('assigned_to', employeeName);
    
  if (error) throw error;
  
  // Map the response to ensure all fields are properly typed
  return (data || []).map(asset => {
    // Create a properly typed asset object with all required fields
    const typedAsset: Asset = {
      ...asset,
      status: asset.status as AssetStatus,
      status_color: asset.status_color as StatusColor | null,
      location: asset.location || null,
      notes: asset.notes || null,
      wear: asset.wear || null,
      qty: asset.qty || 1,
      // Handle categoryIcon separately since it might not exist in DB
      categoryIcon: (asset as any).categoryIcon || null
    };
    
    return typedAsset;
  });
};
