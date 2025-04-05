
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
import { Archive, Smartphone, Globe, Tablet, Package, Computer } from "lucide-react";

// Define the schema for form validation
const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  type: z.enum(["asset", "accessory", "component", "consumable", "license"], {
    required_error: "Please select a category type.",
  }),
  icon: z.string().default("archive"),
});

// Define the form values type
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Props for the CategoryForm component
interface CategoryFormProps {
  onSubmit: (values: Category) => void;
  onCancel: () => void;
  initialValues?: Partial<Category>;
  isEditing?: boolean;
}

// Icon options for the form
const iconOptions = [
  { value: "archive", label: "Inventory", icon: Archive },
  { value: "smartphone", label: "Mobile Phone", icon: Smartphone },
  { value: "globe", label: "Website", icon: Globe },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "package", label: "Accessories", icon: Package },
  { value: "computer", label: "Computer", icon: Computer },
];

export function CategoryForm({ onSubmit, onCancel, initialValues, isEditing = false }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Initialize the form
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

    setIsSubmitting(true);
    
    try {
      // Create a new category with a unique ID
      const categoryId = initialValues?.id || crypto.randomUUID();
      const categoryData = {
        id: categoryId,
        name: values.name,
        type: values.type,
        count: initialValues?.count || 0, // New categories start with 0 items
        user_id: user.id,
        icon: values.icon
      };

      // Save to Supabase
      const { error } = await supabase
        .from('categories')
        .upsert({
          id: categoryId,
          name: values.name,
          type: values.type,
          count: initialValues?.count || 0,
          user_id: user.id,
          icon: values.icon
        });

      if (error) {
        console.error("Error saving category:", error);
        toast.error("Failed to save category");
        setIsSubmitting(false);
        return;
      }

      // Submit the form and reset
      onSubmit(categoryData);
      form.reset();
      toast.success(`Category ${isEditing ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} category:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} category`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get the icon component for a specific value
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
