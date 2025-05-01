
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CSVPreview } from "@/components/CSVPreview";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset, AssetStatus, VALID_ASSET_STATUSES } from "@/lib/api/assets";
import { Package } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createEmployeesFromAssetAssignments } from "@/lib/api/autoCreateEmployees";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ImportAssetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: {
    headers: string[];
    data: string[][];
    fileType: 'csv' | 'excel';
  };
}

export const ImportAssetsDialog = ({ isOpen, onClose, previewData }: ImportAssetsDialogProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [autoCreateEmployees, setAutoCreateEmployees] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivity();
  const { user } = useAuth();
  const { currentTenant, userTenants, isLoading: tenantsLoading } = useTenant();

  const normalizeColumnName = (header: string): string => {
    return header.toLowerCase().trim();
  };

  // If no organization is selected, show a warning and don't allow import
  const noOrganizationSelected = !tenantsLoading && !currentTenant;
  
  // If user has no organizations at all, show a different message
  const noOrganizationsExist = !tenantsLoading && userTenants.length === 0;

  const handleImportConfirm = async () => {
    if (previewData.data.length === 0) {
      toast({
        title: "No data to import",
        description: "The file doesn't contain any valid data rows.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to import assets.",
        variant: "destructive",
      });
      return;
    }

    if (!currentTenant?.id) {
      toast({
        title: "No organization selected",
        description: "Please select an organization before importing assets.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const headers = previewData.headers.map(h => normalizeColumnName(h));
      console.log("Normalized headers:", headers);

      // Track unique assigned_to names for employee creation
      const assignedToSet = new Set<string>();
      const assignedToIndex = headers.indexOf('assigned_to');

      const assets = previewData.data.map(row => {
        const asset: {
          name: string;
          tag: string;
          category: string;
          status: AssetStatus;
          user_id: string;
          tenant_id: string;
          [key: string]: any;
        } = {
          name: '',
          tag: '',
          category: '',
          status: 'ready' as AssetStatus,
          user_id: user.id,
          tenant_id: currentTenant.id,
        };

        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            if (header && row[index] !== '') {
              if (header === 'status') {
                const statusValue = row[index].toLowerCase();
                if (VALID_ASSET_STATUSES.includes(statusValue as AssetStatus)) {
                  asset[header] = statusValue as AssetStatus;
                } else {
                  asset[header] = 'ready' as AssetStatus;
                }
              }
              else if (header === 'status_color') {
                asset[header] = row[index].toLowerCase();
              }
              else if (header === 'qty') {
                asset[header] = parseInt(row[index], 10) || 1;
              }
              else if (header === 'purchase_cost') {
                asset[header] = parseFloat(row[index]) || null;
              }
              else if (header === 'wear') {
                asset[header] = parseInt(row[index], 10) || null;
              }
              else {
                asset[header] = row[index];
              }
            }
          }
        });

        // Add to the set of assigned_to values if it exists
        if (assignedToIndex !== -1 && row[assignedToIndex] && row[assignedToIndex].trim() !== '') {
          assignedToSet.add(row[assignedToIndex].trim());
        }

        if (!asset.name) asset.name = `Imported Asset ${row[0] || ''}`;
        if (!asset.tag) asset.tag = `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        if (!asset.category) asset.category = 'General';
        if (!VALID_ASSET_STATUSES.includes(asset.status)) {
          asset.status = 'ready' as AssetStatus;
        }

        asset.created_at = new Date().toISOString();
        asset.updated_at = new Date().toISOString();

        return asset;
      });

      console.log("Importing assets with tenant_id:", currentTenant.id);

      const { data, error } = await supabase
        .from('assets')
        .insert(assets);

      if (error) {
        let backendErrorInfo = error.message;
        
        if (error.message.includes("column") && error.message.includes("schema cache")) {
          const match = error.message.match(/Could not find the '(.+?)' column/);
          if (match && match[1]) {
            const problematicColumn = match[1];
            const suggestedColumn = problematicColumn.replace(/ /g, "_");
            backendErrorInfo = `Column name error: "${problematicColumn}" doesn't exist in the database. Did you mean "${suggestedColumn}"? Make sure your CSV headers match database column names exactly (e.g., "assigned_to" not "assigned to").`;
          }
        }
        
        if (error.code) backendErrorInfo += ` (code: ${error.code})`;
        if (error.details) backendErrorInfo += ` Details: ${error.details}`;
        if (error.hint) backendErrorInfo += ` Hint: ${error.hint}`;
        throw new Error(backendErrorInfo);
      }

      // Auto-create employees if enabled and we have assigned_to values
      let employeeResult = { created: 0, existing: 0, errors: [] as string[] };
      if (autoCreateEmployees && assignedToSet.size > 0) {
        try {
          employeeResult = await createEmployeesFromAssetAssignments(
            Array.from(assignedToSet),
            currentTenant.id
          );
          
          if (employeeResult.created > 0 || employeeResult.existing > 0) {
            console.log(`Employee creation results:`, employeeResult);
            
            // Invalidate employees query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }
        } catch (employeeError) {
          console.error("Error creating employees:", employeeError);
        }
      }

      logActivity({
        title: "Assets Imported",
        description: `${assets.length} assets imported successfully`,
        category: 'asset',
        icon: <Package className="h-5 w-5 text-blue-600" />
      });

      let successMessage = `${assets.length} assets have been imported.`;
      
      if (employeeResult.created > 0) {
        successMessage += ` ${employeeResult.created} employee records were automatically created.`;
      }
      
      if (employeeResult.errors.length > 0) {
        successMessage += ` Some employees couldn't be created (${employeeResult.errors.length} errors).`;
      }
      
      toast({
        title: "Import successful",
        description: successMessage,
      });

      queryClient.invalidateQueries({ queryKey: ['assets'] });

      onClose();
    } catch (error: any) {
      console.error("Import error:", error);
      let errorMessage = "An unknown error occurred during import.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Show organization selection alert if needed
  if (noOrganizationSelected || noOrganizationsExist) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogTitle>Organization Required</DialogTitle>
          <DialogDescription>
            {noOrganizationsExist ? 
              "You need to create an organization before importing assets." : 
              "Please select an organization before importing assets."}
          </DialogDescription>
          
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {noOrganizationsExist ? "No Organizations Found" : "No Organization Selected"}
            </AlertTitle>
            <AlertDescription>
              {noOrganizationsExist 
                ? "You don't have any organizations. Please create one first." 
                : "You have organizations, but none is currently selected."}
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogTitle>Import Assets</DialogTitle>
        <DialogDescription>
          Review the data below before importing. All required fields must be filled.
        </DialogDescription>
        
        <div className="flex items-center space-x-2 my-2">
          <Switch 
            id="auto-create-employees"
            checked={autoCreateEmployees}
            onCheckedChange={setAutoCreateEmployees}
          />
          <Label htmlFor="auto-create-employees" className="text-sm">
            Automatically create employee records for assigned assets
          </Label>
        </div>
        
        <CSVPreview
          headers={previewData.headers}
          data={previewData.data}
          fileType={previewData.fileType}
          onCancel={onClose}
          onConfirm={handleImportConfirm}
          loading={isImporting}
        />
      </DialogContent>
    </Dialog>
  );
};
