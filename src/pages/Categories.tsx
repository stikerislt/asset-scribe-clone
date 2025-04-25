import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Edit, 
  Trash,
  Tag,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "@/components/CategoryForm";
import { Category, logCategoryActivity, normalizeCategoryName } from "@/lib/data";
import { useActivity } from "@/hooks/useActivity";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/CategoryIcon";

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivity();
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const getCategoriesWithSync = async () => {
      if (!user || !currentTenant?.id) {
        setIsLoading(false);
        setLocalCategories([]);
        return;
      }

      try {
        // 1. Fetch all categories in the categories table (for this tenant)
        const { data: existingCategories = [], error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .order('name');

        if (catError) {
          console.error("Error fetching categories:", catError);
          toast.error("Failed to load categories");
          setIsLoading(false);
          return;
        }

        // 2. Fetch all unique categories from assets table and their counts
        const { data: assetCategoriesData, error: assetError } = await supabase
          .from('assets')
          .select('category')
          .eq('tenant_id', currentTenant.id)
          .neq('category', null)
          .order('category');

        if (assetError) {
          console.error("Error fetching asset categories:", assetError);
          toast.error("Failed to load category data");
          setIsLoading(false);
          return;
        }

        // Count occurrences of each category after normalizing name
        const categoryCounts = new Map<string, number>();
        assetCategoriesData?.forEach(item => {
          if (item && item.category) {
            const normalizedCategory = normalizeCategoryName(item.category);
            categoryCounts.set(normalizedCategory, (categoryCounts.get(normalizedCategory) || 0) + 1);
          }
        });

        // Create a map of existing normalized category names to their full objects
        const existingCategoriesMap = new Map(
          existingCategories.map((cat) => [normalizeCategoryName(cat.name), cat])
        );

        // Find missing categories (in assets but not in categories table)
        const missingCategories: { name: string, normalizedName: string, count: number }[] = [];
        categoryCounts.forEach((count, normalizedCategoryName) => {
          if (!existingCategoriesMap.has(normalizedCategoryName)) {
            // Original case from the first occurrence in assets
            const originalCase = assetCategoriesData.find(a => 
              normalizeCategoryName(a.category) === normalizedCategoryName
            )?.category || normalizedCategoryName;
            
            missingCategories.push({
              name: originalCase,
              normalizedName: normalizedCategoryName,
              count: count
            });
          }
        });

        // Batch insert missing categories
        if (missingCategories.length > 0) {
          const toInsert = missingCategories.map(item => {
            // Determine icon using the same logic as CategoryIcon component
            const categoryName = item.normalizedName;
            let icon = 'archive';
            if (categoryName.includes("inventory")) icon = "menu";
            else if (categoryName.includes("license")) icon = "copyright";
            else if (categoryName.includes("monitor")) icon = "monitor";
            else if (categoryName.includes("printer")) icon = "printer";
            else if (categoryName.includes("accessories")) icon = "package";
            else if (categoryName.includes("computer") || categoryName.includes("pc") || categoryName.includes("laptop")) icon = "computer";
            else if (categoryName.includes("phone") || categoryName.includes("mobile")) icon = "smartphone";
            else if (categoryName.includes("www") || categoryName.includes("web") || categoryName.includes("website")) icon = "globe";
            else if (categoryName.includes("tablet")) icon = "tablet";

            return {
              id: crypto.randomUUID(),
              name: item.name,
              type: "asset",
              icon: icon,
              count: item.count,
              user_id: user.id,
              tenant_id: currentTenant.id,
            };
          });

          try {
            const { error: insertError } = await supabase
              .from('categories')
              .insert(toInsert);

            if (insertError) {
              console.error("Failed to insert missing categories:", insertError);
              toast.error("Failed to sync categories with assets.");
            } else {
              toast.success(`${missingCategories.length} categories auto-added from assets.`);
            }
          } catch (error) {
            console.error("Error inserting categories:", error);
            toast.error("Failed to sync categories with assets");
          }
        }

        // Now, refetch categories to ensure the latest are included
        try {
          const { data: syncedCategories = [], error: syncError } = await supabase
            .from('categories')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('name');

          if (syncError) {
            console.error("Error fetching updated categories:", syncError);
            toast.error("Failed to refresh categories");
            setIsLoading(false);
            return;
          }

          // Update categories with asset counts and handle duplicates
          // We'll merge counts for categories with the same normalized name
          const mergedCategories = new Map<string, Category>();
          
          syncedCategories.forEach(cat => {
            const normalizedName = normalizeCategoryName(cat.name);
            const assetCount = categoryCounts.get(normalizedName) || 0;
            
            // If this normalized name already exists in our map, merge the counts
            if (mergedCategories.has(normalizedName)) {
              const existing = mergedCategories.get(normalizedName)!;
              
              // If the existing entry is older than this one, replace it
              if (existing.id > cat.id) {
                mergedCategories.set(normalizedName, {
                  ...cat,
                  count: assetCount,
                  icon: cat.icon || "archive",
                });
                
                // Delete the duplicate from the database (async)
                supabase
                  .from('categories')
                  .delete()
                  .eq('id', existing.id)
                  .then(() => console.log(`Deleted duplicate category: ${existing.name}`))
                  .catch(err => console.error("Error deleting duplicate category:", err));
              } else {
                // Delete this duplicate from the database (async)
                supabase
                  .from('categories')
                  .delete()
                  .eq('id', cat.id)
                  .then(() => console.log(`Deleted duplicate category: ${cat.name}`))
                  .catch(err => console.error("Error deleting duplicate category:", err));
              }
            } else {
              // First time seeing this normalized name
              mergedCategories.set(normalizedName, {
                ...cat,
                count: assetCount,
                icon: cat.icon || "archive",
              });
            }
          });

          // Convert the map back to an array
          const finalCategories = Array.from(mergedCategories.values());
          setLocalCategories(finalCategories);
        } catch (error) {
          console.error("Error fetching updated categories:", error);
          toast.error("Failed to refresh categories");
        }
      } catch (error) {
        console.error("Error in category/asset sync:", error);
        toast.error("An error occurred while loading categories");
      } finally {
        setIsLoading(false);
      }
    };

    getCategoriesWithSync();
  }, [user, currentTenant]);

  const filteredCategories = localCategories.filter(category => 
    category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category?.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "asset":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case "accessory":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "component":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100/80";
      case "consumable":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100/80";
      case "license":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  const handleAddCategory = async (newCategory: Category) => {
    const normalizedName = normalizeCategoryName(newCategory.name);
    const existing = localCategories.find(cat => 
      normalizeCategoryName(cat.name) === normalizedName
    );

    if (existing) {
      toast.error(`A category with the name "${existing.name}" already exists`);
      return;
    }

    setLocalCategories(prev => [newCategory, ...prev]);
    logCategoryActivity("Created", newCategory);
    setIsAddDialogOpen(false);
  };

  const handleEditCategory = async (updatedCategory: Category) => {
    const normalizedName = normalizeCategoryName(updatedCategory.name);
    const existing = localCategories.find(cat => 
      cat.id !== updatedCategory.id && 
      normalizeCategoryName(cat.name) === normalizedName
    );

    if (existing) {
      toast.error(`A category with the name "${existing.name}" already exists`);
      return;
    }

    setLocalCategories(prev => 
      prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
    );
    logCategoryActivity("Updated", updatedCategory);
    setIsEditDialogOpen(false);
    setCurrentCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setCurrentCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete categories");
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category");
        return;
      }

      setLocalCategories(prev => prev.filter(cat => cat.id !== categoryId));
      
      const deletedCategory = localCategories.find(cat => cat.id === categoryId);
      if (deletedCategory) {
        logCategoryActivity("Deleted", deletedCategory);
      }
      
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error in handleDeleteCategory:", error);
      toast.error("An error occurred while deleting the category");
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your inventory with categories</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0" 
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Asset Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading categories...</span>
              </div>
            ) : !currentTenant ? (
              <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mb-2 text-muted-foreground/50" />
                <p>No organization selected</p>
                <p className="text-sm mt-1">Select an organization to view categories</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Tag className="h-12 w-12 mb-2 text-muted-foreground/50" />
                          <p>No categories found. Click the Add Category button to get started.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <CategoryIcon 
                            category={category.name} 
                            iconType={category.icon}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getTypeColor(category.type)}
                          >
                            {category.type?.charAt(0).toUpperCase() + category.type?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{category.count}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <CategoryForm 
            onSubmit={handleAddCategory}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {currentCategory && (
            <CategoryForm 
              onSubmit={handleEditCategory}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setCurrentCategory(null);
              }}
              initialValues={currentCategory}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
