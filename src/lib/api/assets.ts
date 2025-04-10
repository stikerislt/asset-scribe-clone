
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
      user_id: asset.user_id || null,
      // Handle categoryIcon separately since it might not exist in DB
      categoryIcon: (asset as any).categoryIcon || null
    };
    
    return typedAsset;
  });
};

// Update an asset with proper error handling
export const updateAsset = async (assetId: string, assetData: Partial<Asset>): Promise<Asset> => {
  console.log("Updating asset with ID:", assetId, "Data:", assetData);
  
  // Get the current authenticated user's session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Authentication error:", sessionError);
    throw new Error(`Authentication failed: ${sessionError.message}`);
  }
  
  if (!sessionData.session) {
    console.error("No authenticated session found");
    throw new Error("You must be logged in to update assets");
  }
  
  const currentUserId = sessionData.session.user.id;
  console.log("Current authenticated user ID:", currentUserId);
  
  // First check if asset exists and fetch current data
  const { data: existingAsset, error: fetchError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();
    
  if (fetchError) {
    console.error("Error fetching existing asset:", fetchError);
    throw fetchError;
  }
  
  if (!existingAsset) {
    throw new Error("Asset not found");
  }
  
  console.log("Existing asset data:", existingAsset);
  
  // Check if the user is allowed to update this asset
  if (existingAsset.user_id && existingAsset.user_id !== currentUserId) {
    console.error("User does not have permission to update this asset");
    throw new Error("You don't have permission to update this asset");
  }
  
  // Prepare update data, ensuring all required fields are included from existing asset
  const updateData = {
    // Include required fields from existing asset
    id: assetId,
    name: assetData.name || existingAsset.name,
    category: assetData.category || existingAsset.category,
    tag: assetData.tag || existingAsset.tag,
    status: assetData.status || existingAsset.status,
    
    // Include optional fields from update data or existing asset
    status_color: assetData.status_color || existingAsset.status_color,
    assigned_to: assetData.assigned_to !== undefined ? assetData.assigned_to : existingAsset.assigned_to,
    model: assetData.model !== undefined ? assetData.model : existingAsset.model,
    serial: assetData.serial !== undefined ? assetData.serial : existingAsset.serial,
    purchase_date: assetData.purchase_date !== undefined ? assetData.purchase_date : existingAsset.purchase_date,
    purchase_cost: assetData.purchase_cost !== undefined ? assetData.purchase_cost : existingAsset.purchase_cost,
    location: assetData.location !== undefined ? assetData.location : existingAsset.location,
    notes: assetData.notes !== undefined ? assetData.notes : existingAsset.notes,
    wear: assetData.wear !== undefined ? assetData.wear : existingAsset.wear,
    qty: assetData.qty !== undefined ? assetData.qty : existingAsset.qty,
    
    // Always set user_id to the current authenticated user
    user_id: currentUserId,
    updated_at: new Date().toISOString()
  };
  
  console.log("Final update data to send:", updateData);
  
  // Use update instead of upsert to respect RLS policies
  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('id', assetId)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating asset:", error);
    throw error;
  }
  
  if (!data) {
    throw new Error("No data returned after update");
  }
  
  console.log("Update successful, returned data:", data);
  
  // Convert to proper Asset type
  const updatedAsset: Asset = {
    ...data,
    status: data.status as AssetStatus,
    status_color: data.status_color as StatusColor | null,
    location: data.location || null,
    notes: data.notes || null,
    wear: data.wear || null,
    qty: data.qty || 1,
    user_id: data.user_id,
    // Handle categoryIcon separately since it might not exist in DB
    categoryIcon: (data as any).categoryIcon || null
  };
  
  return updatedAsset;
};
