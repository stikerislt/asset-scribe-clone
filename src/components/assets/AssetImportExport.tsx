
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/hooks/useActivity";
import { Asset, AssetStatus, VALID_ASSET_STATUSES } from "@/lib/api/assets";
import { csvToObjects, objectsToCSV, generateAssetImportTemplate } from "@/lib/csv-utils";
import { parseCSVForPreview } from "@/lib/preview-csv";
import { CSVPreview } from "@/components/CSVPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Import, Download, FileSpreadsheet } from "lucide-react";

interface AssetImportExportProps {
  assets: Asset[];
}

export const AssetImportExport = ({ assets }: AssetImportExportProps) => {
  const { toast } = useToast();
  const { logActivity } = useActivity();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [csvPreviewData, setCsvPreviewData] = useState<{ headers: string[], data: string[][] } | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [importFileType, setImportFileType] = useState<'csv' | 'excel'>('csv');

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
    setImportFileType(isExcel ? 'excel' : 'csv');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        setCsvContent(base64Content);
        
        try {
          const previewData = parseCSVForPreview(base64Content, 'excel');
          if (previewData.headers.length === 0 || previewData.data.length === 0) {
            toast({
              title: "Invalid Excel File",
              description: "Unable to parse Excel data. Please check your file format.",
              variant: "destructive",
            });
            return;
          }
          
          const sanitizedData = {
            headers: previewData.headers.map(h => String(h)),
            data: previewData.data.map(row => row.map(cell => String(cell)))
          };
          
          setCsvPreviewData(sanitizedData);
          setShowCSVPreview(true);
        } catch (error) {
          console.error("Excel preview error:", error);
          toast({
            title: "Preview Failed",
            description: "Failed to preview Excel data. Please check your file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string;
        setCsvContent(csvContent);
        
        try {
          const previewData = parseCSVForPreview(csvContent, 'csv');
          if (previewData.headers.length === 0 || previewData.data.length === 0) {
            toast({
              title: "Invalid CSV",
              description: "Unable to parse CSV data. Please check your file format.",
              variant: "destructive",
            });
            return;
          }
          
          const sanitizedData = {
            headers: previewData.headers.map(h => String(h)),
            data: previewData.data.map(row => row.map(cell => String(cell)))
          };
          
          setCsvPreviewData(sanitizedData);
          setShowCSVPreview(true);
        } catch (error) {
          console.error("CSV preview error:", error);
          toast({
            title: "Preview Failed",
            description: "Failed to preview CSV data. Please check your file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }

    event.target.value = '';
  };
  
  const handleConfirmImport = async () => {
    if (!csvContent) {
      toast({
        title: "Import Failed",
        description: "No data content to import",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let importedAssets;
      
      if (importFileType === 'excel') {
        if (!csvPreviewData) return;
        
        importedAssets = csvPreviewData.data.map(row => {
          const asset: Record<string, any> = {};
          csvPreviewData.headers.forEach((header, index) => {
            asset[header] = row[index] || '';
          });
          return asset;
        });
      } else {
        importedAssets = csvToObjects<{
          name: string;
          tag: string;
          serial: string;
          model: string;
          category: string;
          status: string;
          assigned_to: string;
          location: string;
          purchase_date: string;
          purchase_cost: string;
        }>(csvContent);
      }
      
      const validAssets = importedAssets
        .filter(asset => asset.name && asset.tag);
      
      if (validAssets.length === 0) {
        toast({
          title: "Import Failed",
          description: "No valid assets found in the file",
          variant: "destructive",
        });
        return;
      }

      if (!user?.id) {
        toast({
          title: "Import Failed",
          description: "You must be logged in to import assets",
          variant: "destructive",
        });
        return;
      }

      const importErrors = [];
      const importSuccess = [];

      const DEFAULT_CATEGORY = "General";
      
      for (const asset of validAssets) {
        try {
          const category = asset.category || DEFAULT_CATEGORY;
          
          let status = (asset.status || 'ready').toLowerCase().trim();
          if (!VALID_ASSET_STATUSES.includes(status as AssetStatus)) {
            console.log(`Invalid status "${status}" for asset "${asset.name}", defaulting to "ready"`);
            status = 'ready';
          }
          
          const { error } = await supabase.from('assets').insert([{
            name: asset.name,
            tag: asset.tag,
            serial: asset.serial || '',
            model: asset.model || '',
            category: category,
            status: status as AssetStatus,
            assigned_to: asset.assigned_to || null,
            purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString() : null,
            purchase_cost: asset.purchase_cost ? parseFloat(asset.purchase_cost) : null,
            location: asset.location || '',
            wear: asset.wear || null,
            qty: asset.qty ? parseInt(asset.qty) : 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user.id
          }]);
          
          if (error) {
            console.error('Error importing asset:', error);
            importErrors.push(asset.name);
          } else {
            importSuccess.push(asset.name);
          }
        } catch (error) {
          console.error('Error importing asset:', error);
          importErrors.push(asset.name);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      
      logActivity({
        title: `Assets Imported from ${importFileType.toUpperCase()}`,
        description: `${importSuccess.length} assets imported successfully, ${importErrors.length} failed`,
        category: 'asset',
        icon: <Import className="h-5 w-5 text-blue-600" />
      });

      if (importErrors.length > 0) {
        toast({
          title: "Import Partially Successful",
          description: `${importSuccess.length} assets imported, ${importErrors.length} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Successful",
          description: `${importSuccess.length} assets imported`,
        });
      }
      
      setShowCSVPreview(false);
      setCsvContent(null);
      setCsvPreviewData(null);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "The file format is invalid or there was an error processing your request",
        variant: "destructive",
      });
    }
  };

  const handleExportTemplateClick = () => {
    downloadCSV(generateAssetImportTemplate(), "assets-import-template.csv");
    
    toast({
      title: "Template Exported",
      description: "Asset import template with all columns has been downloaded",
    });
    
    logActivity({
      title: "Template Downloaded",
      description: "Asset import template downloaded",
      category: 'asset',
      icon: <FileSpreadsheet className="h-5 w-5 text-blue-600" />
    });
  };

  const handleExportClick = () => {
    if (assets.length === 0) {
      handleExportTemplateClick();
      return;
    }

    const formattedAssets = assets.map(asset => ({
      tag: asset.tag,
      name: asset.name,
      assigned_to: asset.assigned_to || '',
      purchase_date: asset.purchase_date || '',
      wear: asset.wear || '',
      purchase_cost: asset.purchase_cost || '',
      qty: asset.qty || '1',
    }));
    
    const csv = objectsToCSV(formattedAssets);
    downloadCSV(csv, "assets-export.csv");
    
    logActivity({
      title: "Assets Exported",
      description: `${assets.length} assets exported`,
      category: 'asset',
      icon: <FileSpreadsheet className="h-5 w-5 text-blue-600" />
    });

    toast({
      title: "Export Successful",
      description: `${assets.length} assets exported`,
    });
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".csv,.xlsx,.xls" 
          onChange={handleFileChange}
          className="hidden"
        />
        <Button className="" size="sm" onClick={handleImportClick}>
          <Import className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button className="" size="sm" onClick={handleExportClick}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button className="" size="sm" onClick={handleExportTemplateClick} variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Template
        </Button>
      </div>

      <Dialog open={showCSVPreview} onOpenChange={setShowCSVPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Import Data</DialogTitle>
          </DialogHeader>
          
          {csvPreviewData && (
            <CSVPreview 
              headers={csvPreviewData.headers} 
              data={csvPreviewData.data} 
              onConfirm={handleConfirmImport}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
