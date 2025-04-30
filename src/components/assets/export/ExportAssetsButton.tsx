
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Asset } from "@/lib/api/assets";
import { CSVLink } from "react-csv";

interface ExportAssetsButtonProps {
  assets: Asset[];
}

export const ExportAssetsButton = ({ assets }: ExportAssetsButtonProps) => {
  const csvHeaders = [
    { label: "name", key: "name" },
    { label: "tag", key: "tag" },
    { label: "category", key: "category" },
    { label: "status", key: "status" },
    { label: "status_color", key: "status_color" },
    { label: "assigned_to", key: "assigned_to" },
    { label: "model", key: "model" },
    { label: "serial", key: "serial" },
    { label: "purchase_date", key: "purchase_date" },
    { label: "purchase_cost", key: "purchase_cost" },
    { label: "location", key: "location" },
    { label: "notes", key: "notes" },
    { label: "wear", key: "wear" },
    { label: "qty", key: "qty" },
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
