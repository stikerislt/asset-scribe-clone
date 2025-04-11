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

// Define history entry interface
export interface AssetHistory {
  id: string;
  asset_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string;
  user_id: string | null;
  changed_by: string | null;
  created_at: string;
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

// Record a change in the asset history table
export const recordAssetHistory = async (
  assetId: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string,
  userId: string | null,
  changedBy: string | null
): Promise<void> => {
  console.log(`Recording history for asset ${assetId}, field ${fieldName}: ${oldValue} -> ${newValue}`);
  
  const { error } = await supabase
    .from('asset_history')
    .insert({
      asset_id: assetId,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      user_id: userId,
      changed_by: changedBy
    });
  
  if (error) {
    console.error('Error recording asset history:', error);
    throw error;
  }
};

// Get history for an asset
export const getAssetHistory = async (assetId: string): Promise<AssetHistory[]> => {
  const { data, error } = await supabase
    .from('asset_history')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching asset history:', error);
    throw error;
  }
  
  return (data || []) as unknown as AssetHistory[];
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
  
  // Get user email for history records
  const { data: profileData } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', currentUserId)
    .single();
  
  const changedBy = profileData?.full_name || profileData?.email || 'Unknown user';
  
  // Record history for changed fields
  const recordHistory = async () => {
    // Check for changes in each field and record history
    for (const [key, newValue] of Object.entries(assetData)) {
      const oldValue = existingAsset[key];
      
      // Skip if values are the same or if newValue is undefined
      if (newValue === undefined || newValue === oldValue) continue;
      
      // Convert values to strings for storage
      const oldValueStr = oldValue === null || oldValue === undefined 
        ? null 
        : String(oldValue);
      
      const newValueStr = String(newValue);
      
      // Record history (with user-friendly field names for display)
      let fieldDisplayName = key;
      switch (key) {
        case 'assigned_to':
          fieldDisplayName = 'Assigned To';
          break;
        case 'status':
          fieldDisplayName = 'Status';
          break;
        case 'location':
          fieldDisplayName = 'Location';
          break;
        case 'notes':
          fieldDisplayName = 'Notes';
          break;
        // Add more mappings as needed
      }
      
      await recordAssetHistory(
        assetId,
        fieldDisplayName,
        oldValueStr,
        newValueStr,
        currentUserId,
        changedBy
      );
    }
  };
  
  // Check if user is admin (admins can edit any asset)
  const { data: isAdminData } = await supabase.rpc('is_admin', {
    user_id: currentUserId
  });
  
  const isAdmin = isAdminData || false;
  console.log("Is user admin?", isAdmin);
  
  // If user is not admin and not the owner, prevent update
  if (!isAdmin && existingAsset.user_id && existingAsset.user_id !== currentUserId) {
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
    
    // If admin is editing someone else's asset, keep the original user_id
    // Otherwise, set to current user
    user_id: isAdmin && existingAsset.user_id ? existingAsset.user_id : currentUserId,
    updated_at: new Date().toISOString()
  };
  
  console.log("Final update data to send:", updateData);
  
  try {
    // Record history before updating
    await recordHistory();
    
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
  } catch (error) {
    console.error("Error in update process:", error);
    throw error;
  }
};
