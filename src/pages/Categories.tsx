
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import { Category, logCategoryActivity, fetchCategories, normalizeCategoryName } from "@/lib/data";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const categorySchema = z.object({
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters.",
  }),
  type: z.string().min(2, {
    message: "Category type must be at least 2 characters.",
  }),
  icon: z.string().optional(),
});

type CategorySchemaType = z.infer<typeof categorySchema>;

const Categories = () => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", currentTenant?.id],
    queryFn: () => fetchCategories(currentTenant?.id),
    enabled: !!currentTenant?.id,
  });

  const form = useForm<CategorySchemaType>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "",
      icon: "",
    },
    mode: "onChange",
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (values: CategorySchemaType) => {
      if (!currentTenant) {
        throw new Error("Tenant not found");
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: values.name,
          type: values.type,
          icon: values.icon,
          tenant_id: currentTenant.id,
          user_id: user?.id,
          count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      await logCategoryActivity("Created", data as Category);

      return data as Category;
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CategorySchemaType }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await logCategoryActivity("Updated", data as Category);

      return data as Category;
    },
    onSuccess: () => {
      toast.success("Category updated successfully");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      setIsDeleting(true);
    
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
    
      if (error) throw error;
    
      await logCategoryActivity("Deleted", selectedCategory as Category);
    
      return categoryId;
    },
    onSuccess: (categoryId) => {
      toast.success("Category deleted successfully");
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const onSubmit = async (values: CategorySchemaType) => {
    if (isEditing && selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, values });
    } else {
      createCategoryMutation.mutate(values);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditing(true);
    form.setValue("name", category.name);
    form.setValue("type", category.type);
    form.setValue("icon", category.icon || "");
  };

  const handleDelete = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage categories for your assets
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Category" : "Create Category"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Edit an existing category." : "Create a new category."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Category type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input placeholder="Category icon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                    {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>
            A list of all categories in your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <p>No categories found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.type}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
