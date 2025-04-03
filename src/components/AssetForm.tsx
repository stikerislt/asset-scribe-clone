import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Asset } from "@/lib/data";
import { Package } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivity } from "@/hooks/useActivity";

// Form schema with validation
const assetFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  tag: z.string().min(2, "Asset tag must be at least 2 characters"),
  serial: z.string().optional(),
  model: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["ready", "assigned", "pending", "archived", "broken"]),
  assignedTo: z.string().optional(),
  location: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  onSubmit: (data: Asset) => void;
  onCancel: () => void;
}

export function AssetForm({ onSubmit, onCancel }: AssetFormProps) {
  const { logActivity } = useActivity();
  
  // Default values for the form
  const defaultValues: Partial<AssetFormValues> = {
    status: "ready",
    category: "Hardware",
  };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
  });

  const handleSubmit = (values: AssetFormValues) => {
    // Create a new asset with a unique ID - ensuring all required properties are present
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name: values.name, // Explicitly provide required field
      tag: values.tag,   // Explicitly provide required field
      status: values.status, // Explicitly provide required field
      category: values.category || "Hardware",
      // Optional fields with fallbacks
      serial: values.serial || "",
      model: values.model || "",
      location: values.location || "",
      assignedTo: values.assignedTo,
      purchaseDate: values.purchaseDate || "",
      purchaseCost: values.purchaseCost || "",
    };

    // Log the activity
    logActivity({
      title: "Asset Created",
      description: `${newAsset.name} added to inventory`,
      category: 'asset',
      icon: <Package className="h-5 w-5 text-blue-600" />
    });

    // Submit the form data
    onSubmit(newAsset);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Name</FormLabel>
                <FormControl>
                  <Input placeholder="MacBook Pro 13-inch" {...field} />
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
                <FormLabel>Asset Tag</FormLabel>
                <FormControl>
                  <Input placeholder="LAP-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="serial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input placeholder="SN12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="MacBook Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Peripherals">Peripherals</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="broken">Broken</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Main Office" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost</FormLabel>
                <FormControl>
                  <Input placeholder="1299.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create Asset
          </Button>
        </div>
      </form>
    </Form>
  );
}
