
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Asset, AssetHistory, getAssetHistory } from "@/lib/api/assets";

// Export a default component to make sure the module has a default export
export default function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Query to fetch asset data
  const { data: asset, isLoading, error, refetch } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Asset;
    },
    enabled: !!id
  });
  
  // Query to fetch asset history
  const { data: history } = useQuery({
    queryKey: ['asset-history', id],
    queryFn: () => id ? getAssetHistory(id) : Promise.resolve([]),
    enabled: !!id
  });

  // Handle asset assignment
  const handleAssignAsset = async () => {
    if (!id || !assignedTo) return;
    
    setIsSubmitting(true);
    
    try {
      // Get current session to identify the user making the change
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      // Get current user profile for the changed_by field
      let changedBy = 'Unknown user';
      if (userId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();
        
        changedBy = profileData?.full_name || profileData?.email || 'Unknown user';
      }

      // Record history before updating
      if (asset) {
        await supabase.from('asset_history').insert({
          asset_id: id,
          field_name: 'Assigned To',
          old_value: asset.assigned_to || null,
          new_value: assignedTo,
          user_id: userId,
          changed_by: changedBy
        });
      }
      
      // Update the asset assignment
      const { error } = await supabase
        .from('assets')
        .update({ assigned_to: assignedTo })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Asset assigned successfully");
      setAssignDialogOpen(false);
      
      // Refresh both the asset data and history
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      queryClient.invalidateQueries({ queryKey: ['asset-history', id] });
      refetch();
    } catch (error) {
      toast.error("Failed to assign asset");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // This is just a placeholder component for demonstration purposes
  // In a real application, this would be a complete component with proper UI
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Asset Details</h1>
      {/* Rest of your component implementation */}
      <p>This is a placeholder. Implement the rest of the asset details UI here.</p>
    </div>
  );
}
