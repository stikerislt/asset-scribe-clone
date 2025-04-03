
import { useParams, Link } from "react-router-dom";
import { assets } from "@/lib/data";
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
  Clock
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

const AssetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const asset = assets.find(a => a.id === id);
  
  if (!asset) {
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
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
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
                        <p>{asset.model}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                        <p>{asset.category}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                        <AssetStatusBadge status={asset.status} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                        <p>{asset.location}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Purchase Date</h4>
                        <p>{asset.purchaseDate}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Purchase Cost</h4>
                        <p>{asset.purchaseCost}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Warranty</h4>
                        <p>12 months (expires on {new Date(new Date(asset.purchaseDate).setFullYear(new Date(asset.purchaseDate).getFullYear() + 1)).toLocaleDateString()})</p>
                      </div>
                      {asset.assignedTo && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h4>
                          <p>{asset.assignedTo}</p>
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
                        <p className="font-medium">Assigned to {asset.assignedTo || "User"}</p>
                        <p className="text-sm text-muted-foreground">2023-06-15 by Admin</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pb-4 border-b">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Tag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Status changed to Ready</p>
                        <p className="text-sm text-muted-foreground">2023-05-20 by System</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Asset created</p>
                        <p className="text-sm text-muted-foreground">{asset.purchaseDate} by Admin</p>
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
              <Button className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Assign Asset
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
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
                    <p className="font-medium">{asset.model}</p>
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
                    <p className="font-medium">{asset.purchaseDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Cost</p>
                    <p className="font-medium">{asset.purchaseCost}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{asset.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;
