
import { WarehouseItem } from "./WarehouseItemTransactionDialog";
import { ExportWarehouseItemsButton } from "./export/ExportWarehouseItemsButton";

interface WarehouseImportExportProps {
  items: WarehouseItem[];
  onImportComplete?: () => void;
}

export const WarehouseImportExport = ({ items, onImportComplete }: WarehouseImportExportProps) => {
  return (
    <div className="flex gap-2">
      {/* Import button can be added in the future */}
      <ExportWarehouseItemsButton items={items} />
    </div>
  );
};
