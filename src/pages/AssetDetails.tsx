
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Asset, AssetHistory, getAssetHistory } from "@/lib/api/assets";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusColorIndicator } from "@/components/StatusColorIndicator";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";
import { Pencil, Clipboard, Users, History, ArrowLeft, Loader } from "lucide-react";
import { format } from "date-fns";

export default function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Query to fetch asset data
  const { data: asset, isLoading, error, refetch } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Asset;
    },
    enabled: !!id
  });
  
  // Query to fetch asset history
  const { data: history } = useQuery({
    queryKey: ['asset-history', id],
    queryFn: () => id ? getAssetHistory(id) : Promise.resolve([]),
    enabled: !!id
  });

  // Update assignedTo state when asset data loads
  useEffect(() => {
    if (asset && asset.assigned_to) {
      setAssignedTo(asset.assigned_to);
    }
  }, [asset]);

  // Handle asset assignment
  const handleAssignAsset = async () => {
    if (!id || !assignedTo) return;
    
    setIsSubmitting(true);
    
    try {
      // Get current session to identify the user making the change
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      // Get current user profile for the changed_by field
      let changedBy = 'Unknown user';
      if (userId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();
        
        changedBy = profileData?.full_name || profileData?.email || 'Unknown user';
      }

      // Record history before updating
      if (asset) {
        await supabase.from('asset_history').insert({
          asset_id: id,
          field_name: 'Assigned To',
          old_value: asset.assigned_to || null,
          new_value: assignedTo,
          user_id: userId,
          changed_by: changedBy
        });
      }
      
      // Update the asset assignment
      const { error } = await supabase
        .from('assets')
        .update({ assigned_to: assignedTo })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Asset assigned successfully");
      setAssignDialogOpen(false);
      
      // Refresh both the asset data and history
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      queryClient.invalidateQueries({ queryKey: ['asset-history', id] });
      refetch();
    } catch (error) {
      toast.error("Failed to assign asset");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg font-semibold text-red-500">Error loading asset</p>
        <p className="text-sm text-gray-500 mb-4">The asset may have been deleted or you don't have permission to view it</p>
        <Button asChild>
          <Link to="/assets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/assets">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Assets
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{asset.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAssignDialogOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Assign
          </Button>
          <Button asChild>
            <Link to={`/assets/edit/${id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Asset
            </Link>
          </Button>
        </div>
      </div>

      {/* Asset tag and status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1">
          <Clipboard className="h-3.5 w-3.5" />
          <span className="font-medium">Tag: {asset.tag}</span>
        </div>
        
        <AssetStatusBadge status={asset.status} />
        
        {asset.status_color && (
          <div className="flex items-center gap-1.5">
            <StatusColorIndicator color={asset.status_color} />
            <span className="text-sm font-medium">
              {asset.status_color === 'green' ? 'Good' : 
               asset.status_color === 'yellow' ? 'Warning' : 
               asset.status_color === 'red' ? 'Critical' : 'Unknown'}
            </span>
          </div>
        )}
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">
            History
            {history && history.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 inline-flex items-center justify-center px-1.5">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Details tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Information</CardTitle>
                <CardDescription>Basic details about this asset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <p className="font-medium">{asset.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    <p className="font-medium">{asset.model || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Serial</Label>
                    <p className="font-medium">{asset.serial || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="font-medium">{asset.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Assigned To</Label>
                    <p className="font-medium">{asset.assigned_to || 'Unassigned'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantity</Label>
                    <p className="font-medium">{asset.qty || 1}</p>
                  </div>
                </div>

                {asset.notes && (
                  <>
                    <Label className="text-xs text-muted-foreground block mt-4">Notes</Label>
                    <p className="text-sm">{asset.notes}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Information</CardTitle>
                <CardDescription>Acquisition and financial details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Purchase Date</Label>
                    <p className="font-medium">
                      {asset.purchase_date 
                        ? format(new Date(asset.purchase_date), 'PPP') 
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Purchase Cost</Label>
                    <p className="font-medium">
                      {asset.purchase_cost 
                        ? `$${asset.purchase_cost.toFixed(2)}` 
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Expected Wear (Years)</Label>
                    <p className="font-medium">{asset.wear || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="font-medium">
                      {format(new Date(asset.created_at), 'PPP')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* History tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> 
                Asset History
              </CardTitle>
              <CardDescription>
                Track changes made to this asset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Field</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">From</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">To</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Changed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 text-sm">
                            {format(new Date(item.created_at), 'PPP')}
                          </td>
                          <td className="p-3 text-sm font-medium">{item.field_name}</td>
                          <td className="p-3 text-sm">{item.old_value || '(empty)'}</td>
                          <td className="p-3 text-sm">{item.new_value}</td>
                          <td className="p-3 text-sm">{item.changed_by || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No history records available for this asset
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Enter the name of the employee or department to assign this asset to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                placeholder="Employee name or department"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAsset} disabled={isSubmitting || !assignedTo.trim()}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
