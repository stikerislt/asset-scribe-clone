
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Asset } from "@/lib/api/assets";
import { CSVLink } from "react-csv";

interface ExportAssetsButtonProps {
  assets: Asset[];
}

export const ExportAssetsButton = ({ assets }: ExportAssetsButtonProps) => {
  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Tag", key: "tag" },
    { label: "Category", key: "category" },
    { label: "Status", key: "status" },
    { label: "Status Color", key: "status_color" },
    { label: "Assigned To", key: "assigned_to" },
    { label: "Model", key: "model" },
    { label: "Serial", key: "serial" },
    { label: "Purchase Date", key: "purchase_date" },
    { label: "Purchase Cost", key: "purchase_cost" },
    { label: "Location", key: "location" },
    { label: "Notes", key: "notes" },
    { label: "Wear", key: "wear" },
    { label: "Qty", key: "qty" },
  ];

  return (
    <CSVLink
      data={assets}
      headers={csvHeaders}
      filename={"assets.csv"}
    >
      <Button size="sm" variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </CSVLink>
  );
};
