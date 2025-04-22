
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  User, 
  Bell, 
  Database, 
  Lock,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/api/userRoles";

// Schema for account settings
const accountSettingsSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;

// Schema for notification settings
const notificationSettingsSchema = z.object({
  assetAlerts: z.boolean().default(true),
  lowInventoryAlerts: z.boolean().default(false),
  lowInventoryThreshold: z.number().min(1).default(5),
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  
  // Account settings form
  const accountForm = useForm<AccountSettingsValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification settings form
  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      assetAlerts: true,
      lowInventoryAlerts: false,
      lowInventoryThreshold: 5,
    },
  });
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const adminStatus = await isAdmin(user.id);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const onSaveAccountSettings = async (data: AccountSettingsValues) => {
    setIsLoading(true);
    try {
      // First verify the current password by attempting a password sign-in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      });
      
      if (verifyError) {
        toast.error("Current password is incorrect");
        setIsLoading(false);
        return;
      }
      
      // If verification passed, update the password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) {
        toast.error("Failed to update password: " + error.message);
      } else {
        toast.success("Password updated successfully");
        accountForm.reset();
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onSaveNotificationSettings = (data: NotificationSettingsValues) => {
    console.log("Notification settings saved:", data);
    toast.success("Notification settings saved successfully");
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your ekspeer.com Inventory instance</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="security">
              <Lock className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your profile and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Profile Information</h3>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" value={user?.email || ''} className="col-span-3" disabled />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Change Password</h3>
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(onSaveAccountSettings)} className="space-y-4">
                    <FormField
                      control={accountForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={accountForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={accountForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure inventory alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onSaveNotificationSettings)} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="assetAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Asset Checkout Alerts</FormLabel>
                          <FormDescription>
                            Receive notifications when assets are checked out
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
                    control={notificationForm.control}
                    name="lowInventoryAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Low Inventory Alerts</FormLabel>
                          <FormDescription>
                            Get notified when inventory items fall below threshold
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
                    control={notificationForm.control}
                    name="lowInventoryThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Inventory Threshold</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when items fall below this quantity
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Save Notification Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings - Only shown to admin users */}
        {isAdmin && (
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure organization-wide security policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Policy</Label>
                  <div className="grid gap-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Minimum Password Length</Label>
                        <p className="text-sm text-muted-foreground">
                          Set the minimum character requirement for passwords
                        </p>
                      </div>
                      <Input 
                        type="number" 
                        value="8"
                        min={8}
                        max={64}
                        className="w-20 text-right"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="require-uppercase" />
                      <Label htmlFor="require-uppercase">Require uppercase letters</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="require-numbers" defaultChecked />
                      <Label htmlFor="require-numbers">Require numbers</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="require-symbols" />
                      <Label htmlFor="require-symbols">Require special characters</Label>
                    </div>
                  </div>
                </div>
                
                <Button>Save Security Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
