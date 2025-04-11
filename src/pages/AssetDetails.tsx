
  // This is a partial update of the handleAssignAsset function inside AssetDetails.tsx
  
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
