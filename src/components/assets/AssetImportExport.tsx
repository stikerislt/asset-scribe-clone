
import { Asset } from "@/lib/api/assets";
import { ImportAssetsButton } from "./import/ImportAssetsButton";
import { ExportAssetsButton } from "./export/ExportAssetsButton";

interface AssetImportExportProps {
  assets: Asset[];
  onImportComplete?: () => void;
}

export const AssetImportExport = ({ assets, onImportComplete }: AssetImportExportProps) => {
  return (
    <div className="flex gap-2">
      <ImportAssetsButton onImportComplete={onImportComplete} />
      <ExportAssetsButton assets={assets} />
    </div>
  );
};
