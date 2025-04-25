
import { Asset } from "@/lib/api/assets";
import { ImportAssetsButton } from "./import/ImportAssetsButton";
import { ExportAssetsButton } from "./export/ExportAssetsButton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AssetImportExportProps {
  assets: Asset[];
  onImportComplete?: () => void;
}

export const AssetImportExport = ({ assets, onImportComplete }: AssetImportExportProps) => {
  // We don't need to check admin access here anymore since it's handled by the parent component
  return (
    <div className="flex gap-2">
      <ImportAssetsButton onImportComplete={onImportComplete} />
      <ExportAssetsButton assets={assets} />
    </div>
  );
};
