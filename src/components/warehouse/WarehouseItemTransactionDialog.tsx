
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

// Define the warehouse item interface
export interface WarehouseItem {
  id: string;
  name: string;
  tag: string;
  category: string;
  status: string;
  description: string | null;
  quantity: number;
  location: string | null;
  supplier: string | null;
  reorder_level: number | null;
  cost: number | null;
  tenant_id: string | null;
  user_id: string | null;
}

const transactionSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be a positive number"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface WarehouseItemTransactionDialogProps {
  item: WarehouseItem | null;
  isOpen: boolean;
  onClose: () => void;
  transactionType: "add" | "remove";
}

export function WarehouseItemTransactionDialog({
  item,
  isOpen,
  onClose,
  transactionType,
}: WarehouseItemTransactionDialogProps) {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      quantity: 1,
      reason: "",
      notes: "",
    },
  });

  async function onSubmit(values: TransactionFormValues) {
    if (!item || !currentTenant?.id) {
      toast({
        title: "Error",
        description: "Missing item or tenant information",
        variant: "destructive",
      });
      return;
    }

    // Check if removing more than available
    if (transactionType === "remove" && values.quantity > item.quantity) {
      toast({
        title: "Error",
        description: "Cannot remove more items than available in inventory",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("warehouse_transactions").insert({
        warehouse_item_id: item.id,
        transaction_type: transactionType,
        quantity: values.quantity,
        reason: values.reason || null,
        notes: values.notes || null,
        user_id: user?.id || null,
        tenant_id: currentTenant.id,
      });

      if (error) throw error;

      toast({
        title: "Transaction Recorded",
        description: `Successfully ${
          transactionType === "add" ? "added" : "removed"
        } ${values.quantity} items`,
      });

      // Invalidate queries to refresh warehouse item data
      queryClient.invalidateQueries({ queryKey: ["warehouse-items"] });
      queryClient.invalidateQueries({
        queryKey: ["warehouse-transactions"],
      });

      form.reset();
      onClose();
    } catch (error) {
      console.error("Error recording transaction:", error);
      toast({
        title: "Error",
        description: "Failed to record transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transactionType === "add" ? "Add to" : "Remove from"} Inventory
          </DialogTitle>
        </DialogHeader>

        {item && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="text-sm mb-4">
                <div className="font-semibold">{item.name}</div>
                <div className="text-muted-foreground">Tag: {item.tag}</div>
                <div className="text-muted-foreground mt-1">
                  Current quantity: {item.quantity}
                </div>
              </div>

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to {transactionType}</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Reason for transaction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    `${transactionType === "add" ? "Add" : "Remove"} Items`
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
