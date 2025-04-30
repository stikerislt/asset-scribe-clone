
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Package } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useActivity } from "@/hooks/useActivity";
import { Asset } from "@/lib/api/assets";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  expected_return_date: z.date().optional(),
});

type TransactionType = "check_out" | "check_in";

interface AssetTransactionDialogProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
  transactionType: TransactionType;
}

export function AssetTransactionDialog({
  asset,
  isOpen,
  onClose,
  transactionType,
}: AssetTransactionDialogProps) {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const { logActivity } = useActivity();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      purpose: "",
      notes: "",
    },
  });

  const maxQuantity = transactionType === "check_out" ? (asset.qty || 1) : 10;
  const isCheckOut = transactionType === "check_out";

  const transactionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user?.id || !currentTenant?.id) {
        throw new Error("User not authenticated or no tenant selected");
      }

      const { data, error } = await supabase
        .from("asset_transactions")
        .insert({
          asset_id: asset.id,
          user_id: user.id,
          tenant_id: currentTenant.id,
          transaction_type: transactionType,
          quantity: values.quantity,
          purpose: values.purpose || null,
          expected_return_date: values.expected_return_date
            ? values.expected_return_date.toISOString()
            : null,
          notes: values.notes || null,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", asset.id] });
      queryClient.invalidateQueries({ queryKey: ["asset-transactions"] });

      const actionText = isCheckOut ? "checked out" : "checked in";
      const icon = isCheckOut ? "📤" : "📥";

      logActivity({
        title: `Asset ${actionText}`,
        description: `${form.getValues().quantity} units of ${asset.name} ${actionText}`,
        category: "asset",
        icon: <Package className="h-5 w-5 text-blue-600" />,
      });

      toast.success(`Asset ${actionText} successfully`, {
        description: `${form.getValues().quantity} units of ${asset.name} have been ${actionText}`,
      });

      form.reset();
      onClose();
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsPending(true);
      await transactionMutation.mutateAsync(values);
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(
        `Failed to ${isCheckOut ? "check out" : "check in"} asset`,
        {
          description: (error as Error).message,
        }
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isCheckOut ? "Check Out" : "Check In"} Asset
          </DialogTitle>
          <DialogDescription>
            {isCheckOut
              ? "Record asset being taken from inventory."
              : "Record asset being returned to inventory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/30">
              <p className="font-medium">{asset.name}</p>
              <p className="text-sm text-muted-foreground">Tag: {asset.tag}</p>
              {isCheckOut && (
                <p className="text-sm text-muted-foreground mt-1">
                  Available: {asset.qty || 0} units
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What will this be used for?"
                      {...field}
                      value={field.value || ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCheckOut && (
              <FormField
                control={form.control}
                name="expected_return_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Return Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                            disabled={isPending}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date > new Date(2100, 0, 1)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional details..."
                      {...field}
                      value={field.value || ""}
                      disabled={isPending}
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
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Processing...
                  </>
                ) : isCheckOut ? (
                  "Check Out"
                ) : (
                  "Check In"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
