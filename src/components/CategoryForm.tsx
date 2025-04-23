import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category } from "@/lib/data";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Archive, Smartphone, Globe, Tablet, Package, Computer, Monitor, Printer, Copyright, Menu } from "lucide-react";

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  type: z.enum(["asset", "accessory", "component", "consumable", "license"], {
    required_error: "Please select a category type.",
  }),
  icon: z.string().default("archive"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  onSubmit: (values: Category) => void;
  onCancel: () => void;
  initialValues?: Partial<Category>;
  isEditing?: boolean;
}

const iconOptions = [
  { value: "archive", label: "Archive/Default", icon: Archive },
  { value: "smartphone", label: "Phone/Mobile", icon: Smartphone },
  { value: "globe", label: "Website/Web", icon: Globe },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "package", label: "Accessories", icon: Package },
  { value: "computer", label: "Computer/PC/Laptop", icon: Computer },
  { value: "monitor", label: "Monitor", icon: Monitor },
  { value: "printer", label: "Printer", icon: Printer },
  { value: "copyright", label: "License", icon: Copyright },
  { value: "menu", label: "Inventory", icon: Menu },
];

export function CategoryForm({ onSubmit, onCancel, initialValues, isEditing = false }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialValues?.name || "",
      type: (initialValues?.type as any) || "asset",
      icon: initialValues?.icon || "archive",
    },
  });

  const handleSubmit = async (values: CategoryFormValues) => {
    if (!user) {
      toast.error("You must be logged in to create categories");
      return;
    }

    if (!currentTenant?.id) {
      toast.error("You must select an organization to create categories");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const categoryId = initialValues?.id || crypto.randomUUID();
      
      const supabaseData = {
        id: categoryId,
        name: values.name,
        type: values.type,
        icon: values.icon,
        count: initialValues?.count || 0,
        user_id: user.id,
        tenant_id: currentTenant?.id
      };

      const { error } = await supabase
        .from('categories')
        .upsert(supabaseData);

      if (error) {
        console.error("Error saving category:", error);
        toast.error("Failed to save category");
        setIsSubmitting(false);
        return;
      }

      onSubmit(supabaseData as Category);
      form.reset();
      toast.success(`Category ${isEditing ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} category:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} category`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForValue = (value: string) => {
    const option = iconOptions.find(opt => opt.value === value);
    if (!option) return null;
    
    const IconComponent = option.icon;
    return <IconComponent className="h-4 w-4 mr-2" />;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
              </FormControl>
              <FormDescription>
                The name of the category as it will appear in lists.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                    <SelectItem value="component">Component</SelectItem>
                    <SelectItem value="consumable">Consumable</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of items this category will contain.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Icon</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center">
                        {getIconForValue(field.value)}
                        {iconOptions.find(opt => opt.value === field.value)?.label || "Select an icon"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {iconOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="h-4 w-4 mr-2" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose an icon that represents this category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Category" : "Create Category")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
