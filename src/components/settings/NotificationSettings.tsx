
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  asset_checkout_alerts: z.boolean().default(true),
  low_inventory_alerts: z.boolean().default(false),
  low_inventory_threshold: z.coerce.number().min(1).default(5),
  email_notifications: z.boolean().default(false),
});

type NotificationSettings = z.infer<typeof formSchema>;

export function NotificationSettings() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm<NotificationSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset_checkout_alerts: true,
      low_inventory_alerts: false,
      low_inventory_threshold: 5,
      email_notifications: false,
    },
  });

  // Fetch existing notification settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings", user?.id, currentTenant?.id],
    queryFn: async () => {
      if (!user?.id || !currentTenant?.id) return null;

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .eq("tenant_id", currentTenant.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is expected if user has no settings yet
        console.error("Error fetching notification settings:", error);
        toast.error("Failed to load notification settings");
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!currentTenant?.id,
  });

  // Update form with fetched settings
  useEffect(() => {
    if (settings) {
      form.reset({
        asset_checkout_alerts: settings.asset_checkout_alerts ?? true,
        low_inventory_alerts: settings.low_inventory_alerts ?? false,
        low_inventory_threshold: settings.low_inventory_threshold ?? 5,
        email_notifications: settings.email_notifications ?? false,
      });
    }
  }, [settings, form]);

  // Save notification settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      if (!user?.id || !currentTenant?.id) {
        throw new Error("User not authenticated or no tenant selected");
      }

      // Check if settings already exist
      if (settings?.id) {
        // Update existing settings
        const { data: updatedData, error } = await supabase
          .from("notification_settings")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id)
          .select();

        if (error) throw error;
        return updatedData;
      } else {
        // Create new settings
        const { data: newData, error } = await supabase
          .from("notification_settings")
          .insert({
            user_id: user.id,
            tenant_id: currentTenant.id,
            ...data,
          })
          .select();

        if (error) throw error;
        return newData;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-settings"],
      });
      toast.success("Notification settings saved");
    },
    onError: (error) => {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification settings");
    },
  });

  const onSubmit = async (data: NotificationSettings) => {
    setLoading(true);
    try {
      await saveSettingsMutation.mutateAsync(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center">
          <BellRing className="mr-2 h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how and when you receive notifications about inventory
          changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              id="notification-settings-form"
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="asset_checkout_alerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Asset Check-out Alerts
                        </FormLabel>
                        <FormDescription>
                          Receive notifications when assets are checked out or
                          returned.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="low_inventory_alerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Low Inventory Alerts
                        </FormLabel>
                        <FormDescription>
                          Get notified when inventory levels fall below the
                          threshold.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("low_inventory_alerts") && (
                  <FormField
                    control={form.control}
                    name="low_inventory_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Inventory Threshold</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          You'll be notified when item quantity falls below this
                          number.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email_notifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Email Notifications
                        </FormLabel>
                        <FormDescription>
                          Receive notifications via email in addition to in-app
                          alerts.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="notification-settings-form"
          disabled={loading || isLoading}
          className="ml-auto"
        >
          {loading ? (
            <>
              <div className="animate-spin mr-2">◌</div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
