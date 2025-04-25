
import { Asset } from "@/lib/api/assets";
import { ImportAssetsButton } from "./import/ImportAssetsButton";
import { ExportAssetsButton } from "./export/ExportAssetsButton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AssetImportExportProps {
  assets: Asset[];
  onImportComplete?: () => void;
}

export const AssetImportExport = ({ assets, onImportComplete }: AssetImportExportProps) => {
  const { user } = useAuth();
  
  const { data: hasAdminAccess = false } = useQuery({
    queryKey: ['user-admin-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Check if user is owner of any tenant
      const { data: ownerData } = await supabase
        .from('tenant_memberships')
        .select('is_owner')
        .eq('user_id', user.id)
        .eq('is_owner', true)
        .single();
      
      if (ownerData?.is_owner) return true;
      
      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      return roleData?.role === 'admin';
    },
    enabled: !!user
  });

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <ImportAssetsButton onImportComplete={onImportComplete} />
      <ExportAssetsButton assets={assets} />
    </div>
  );
};

