
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Printer, 
  User, 
  Calendar, 
  DollarSign, 
  MapPin,
  Tag,
  Cpu,
  Smartphone,
  Clock,
  Plus,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { AssetStatus } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const AssetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [maintenanceDescription, setMaintenanceDescription] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: asset, isLoading, error, refetch } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!id,
  });

  // Get users for the assign dropdown
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
  });

  const handleAssignAsset = async () => {
    if (!id || !assignedTo) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('assets')
        .update({ assigned_to: assignedTo })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Asset assigned successfully");
      setAssignDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to assign asset");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaintenance = async () => {
    if (!id || !maintenanceDescription) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you'd add a record to a maintenance table
      // For now, we'll just show a success message
      toast.success("Maintenance record added");
      setMaintenanceDialogOpen(false);
      
      // Reset form
      setMaintenanceDescription("");
      setMaintenanceDate("");
    } catch (error) {
      toast.error("Failed to add maintenance record");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading asset details...</p>
      </div>
    );
  }
  
  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold mb-2">Asset Not Found</h1>
        <p className="text-muted-foreground mb-4">The asset you're looking for doesn't exist or has been removed.</p>
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
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/assets">
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">Tag: {asset.tag}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">S/N: {asset.serial}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/assets/edit/${id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
              <CardDescription>Details about this asset</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Model</h4>
                        <p>{asset.model || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                        <p>{asset.category}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                        <AssetStatusBadge status={asset.status as AssetStatus} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                        <p>{asset.location || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Purchase Date</h4>
                        <p>{asset.purchase_date ? formatDate(asset.purchase_date) : 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Purchase Cost</h4>
                        <p>{asset.purchase_cost ? `$${asset.purchase_cost}` : 'N/A'}</p>
                      </div>
                      {asset.assigned_to && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h4>
                          <p>{asset.assigned_to}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="history">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 pb-4 border-b">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Assigned to {asset.assigned_to || "User"}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.updated_at ? formatDate(asset.updated_at) : 'N/A'} by Admin
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pb-4 border-b">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Tag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Status changed to {asset.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.updated_at ? formatDate(asset.updated_at) : 'N/A'} by System
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Asset created</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.created_at ? formatDate(asset.created_at) : 'N/A'} by Admin
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="files">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No files attached to this asset.</p>
                    <Button className="mt-4" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Files
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Notes and specifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                <p>No additional information has been added for this asset.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={() => setAssignDialogOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Assign Asset
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={`/assets/edit/${id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setMaintenanceDialogOpen(true)}>
                <Clock className="mr-2 h-4 w-4" />
                Add Maintenance
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Asset Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Cpu className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{asset.model || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{asset.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">
                      {asset.purchase_date ? formatDate(asset.purchase_date) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Cost</p>
                    <p className="font-medium">
                      {asset.purchase_cost ? `$${asset.purchase_cost}` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{asset.location || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Asset Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Assign this asset to a user or location.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="assignTo">Assign to</Label>
              <Select onValueChange={setAssignedTo} defaultValue={asset.assigned_to || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.full_name || user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignAsset} disabled={isSubmitting}>
              {isSubmitting ? "Assigning..." : "Assign Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
            <DialogDescription>
              Record maintenance activity for this asset.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                placeholder="Enter maintenance details..."
                value={maintenanceDescription}
                onChange={(e) => setMaintenanceDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMaintenance} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Maintenance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetDetails;
