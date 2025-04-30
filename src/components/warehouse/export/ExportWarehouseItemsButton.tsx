
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CSVLink } from "react-csv";
import { WarehouseItem } from "@/components/warehouse/WarehouseItemTransactionDialog";

interface ExportWarehouseItemsButtonProps {
  items: WarehouseItem[];
}

export const ExportWarehouseItemsButton = ({ items }: ExportWarehouseItemsButtonProps) => {
  const csvHeaders = [
    { label: "id", key: "id" },
    { label: "name", key: "name" },
    { label: "tag", key: "tag" },
    { label: "category", key: "category" },
    { label: "status", key: "status" },
    { label: "description", key: "description" },
    { label: "quantity", key: "quantity" },
    { label: "location", key: "location" },
    { label: "supplier", key: "supplier" },
    { label: "reorder_level", key: "reorder_level" },
    { label: "cost", key: "cost" },
    { label: "created_at", key: "created_at" },
    { label: "updated_at", key: "updated_at" },
  ];

  return (
    <CSVLink
      data={items}
      headers={csvHeaders}
      filename={"warehouse_items.csv"}
    >
      <Button size="sm" variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </CSVLink>
  );
};
