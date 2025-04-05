
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetForm } from "@/components/AssetForm";
import { toast } from "sonner";
import { Asset, AssetStatus } from "@/lib/api/assets";
import { StatusColor } from "@/lib/data";

const EditAsset = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Convert database object to Asset type, ensuring properties exist
      const assetData: Asset = {
        ...data,
        status: data.status as AssetStatus,
        notes: data.notes || null,
        wear: data.wear || null,
        qty: data.qty || 1,
        status_color: (data.status_color as StatusColor) || null
      };
      
      return assetData;
    },
    enabled: !!id,
  });

  const handleSubmit = async (formData: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('assets')
        .update(formData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Asset updated successfully");
      navigate(`/assets/${id}`);
    } catch (error) {
      toast.error("Failed to update asset");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/assets/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading asset details...</p>
      </div>
    );
  }
  
  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold mb-2">Asset Not Found</h1>
        <p className="text-muted-foreground mb-4">The asset you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/assets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link to={`/assets/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Asset</h1>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <AssetForm 
          initialData={asset} 
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default EditAsset;
