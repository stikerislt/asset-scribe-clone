
import { Asset } from "@/lib/api/assets";
import { ImportAssetsButton } from "./import/ImportAssetsButton";
import { ExportAssetsButton } from "./export/ExportAssetsButton";

interface AssetImportExportProps {
  assets: Asset[];
}

export const AssetImportExport = ({ assets }: AssetImportExportProps) => {
  return (
    <div className="flex gap-2">
      <ImportAssetsButton />
      <ExportAssetsButton assets={assets} />
    </div>
  );
};
