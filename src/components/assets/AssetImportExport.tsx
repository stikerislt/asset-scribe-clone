
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Asset } from "@/lib/api/assets";
import { CSVLink } from "react-csv";

interface AssetImportExportProps {
  assets: Asset[];
}

export const AssetImportExport = ({ assets }: AssetImportExportProps) => {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<any[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsedData = parseCSV(csvText);
      setCsvData(parsedData);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const data = lines[i].split(',');
      if (data.length === headers.length) {
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j].trim()] = data[j].trim();
        }
        result.push(obj);
      }
    }
    return result;
  };

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
    <div className="flex gap-2">
      <div>
        <Button size="sm" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
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
    </div>
  );
};
