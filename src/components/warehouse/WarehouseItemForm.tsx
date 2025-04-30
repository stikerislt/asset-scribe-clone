
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";

const warehouseItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tag: z.string().min(1, "Tag is required"),
  category: z.string().min(1, "Category is required"),
  status: z.string().default("available"),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or greater"),
  location: z.string().optional(),
  supplier: z.string().optional(),
  reorder_level: z.coerce.number().int().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
});

export type WarehouseItemFormValues = z.infer<typeof warehouseItemSchema>;

interface WarehouseItemFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<WarehouseItemFormValues>;
  isEdit?: boolean;
  itemId?: string;
}

export function WarehouseItemForm({
  onSuccess,
  onCancel,
  defaultValues,
  isEdit = false,
  itemId,
}: WarehouseItemFormProps) {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<WarehouseItemFormValues>({
    resolver: zodResolver(warehouseItemSchema),
    defaultValues: defaultValues || {
      name: "",
      tag: "",
      category: "",
      status: "available",
      description: "",
      quantity: 0,
      location: "",
      supplier: "",
      reorder_level: 5,
      cost: 0,
    },
  });

  async function onSubmit(values: WarehouseItemFormValues) {
    if (!currentTenant?.id) {
      toast({
        title: "No active tenant",
        description: "Please select an organization first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && itemId) {
        const { error } = await supabase
          .from("warehouse_items")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        if (error) throw error;

        toast({
          title: "Item Updated",
          description: `${values.name} has been updated successfully`,
        });
      } else {
        const { error } = await supabase.from("warehouse_items").insert({
          ...values,
          tenant_id: currentTenant.id,
          user_id: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        toast({
          title: "Item Added",
          description: `${values.name} has been added to the warehouse`,
        });
      }

      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving warehouse item:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "save"} item. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Item name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag</FormLabel>
                <FormControl>
                  <Input placeholder="Item tag/SKU" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Item category" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Input placeholder="Item status" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reorder_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Storage location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Input placeholder="Supplier name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Item description"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : isEdit ? (
              "Update Item"
            ) : (
              "Add Item"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
