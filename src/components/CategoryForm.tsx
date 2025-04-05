
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

// Define the schema for form validation
const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  type: z.enum(["asset", "accessory", "component", "consumable", "license"], {
    required_error: "Please select a category type.",
  }),
});

// Define the form values type
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Props for the CategoryForm component
interface CategoryFormProps {
  onSubmit: (values: Category) => void;
  onCancel: () => void;
}

export function CategoryForm({ onSubmit, onCancel }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Initialize the form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: "asset",
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
      const newCategoryId = crypto.randomUUID();
      const newCategory: Category = {
        id: newCategoryId,
        name: values.name,
        type: values.type,
        count: 0, // New categories start with 0 items
        user_id: user.id
      };

      // Save to Supabase
      const { error } = await supabase
        .from('categories')
        .insert({
          id: newCategoryId,
          name: values.name,
          type: values.type,
          count: 0,
          user_id: user.id
        });

      if (error) {
        console.error("Error saving category:", error);
        toast.error("Failed to save category");
        setIsSubmitting(false);
        return;
      }

      // Submit the form and reset
      onSubmit(newCategory);
      form.reset();
      toast.success("Category created successfully");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
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
            {isSubmitting ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
