
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  Building, 
  User, 
  Bell, 
  Database, 
  Lock 
} from "lucide-react";

// Schema for general settings
const generalSettingsSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  adminEmail: z.string().email({ message: "Please enter a valid email address." }),
  siteUrl: z.string().url({ message: "Please enter a valid URL." }),
  timezone: z.string().min(1, { message: "Please select a timezone." }),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

// Schema for notification settings
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  checkoutAlerts: z.boolean().default(true),
  checkoutEmails: z.boolean().default(true),
  lowInventoryAlerts: z.boolean().default(false),
  lowInventoryThreshold: z.number().min(1).default(5),
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  
  // General settings form
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "ekspeer.com Inventory",
      adminEmail: "admin@example.com",
      siteUrl: "https://ekspeer.com",
      timezone: "UTC",
    },
  });

  // Notification settings form
  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      checkoutAlerts: true,
      checkoutEmails: true,
      lowInventoryAlerts: false,
      lowInventoryThreshold: 5,
    },
  });

  const onSaveGeneralSettings = (data: GeneralSettingsValues) => {
    console.log("General settings saved:", data);
    toast.success("General settings saved successfully");
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
          <TabsTrigger value="general">
            <Building className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Configure basic company information and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSaveGeneralSettings)} className="space-y-4">
                  <FormField
                    control={generalForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be displayed in the application title and emails.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          System notifications will be sent to this address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="siteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          The URL where your application is hosted.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          All dates and times will be displayed in this timezone.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Save Changes</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your profile and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Information</Label>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" value="Admin User" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" value="admin@example.com" className="col-span-3" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Change Password</Label>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="current-password" className="text-right">
                      Current Password
                    </Label>
                    <Input id="current-password" type="password" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-password" className="text-right">
                      New Password
                    </Label>
                    <Input id="new-password" type="password" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="confirm-password" className="text-right">
                      Confirm Password
                    </Label>
                    <Input id="confirm-password" type="password" className="col-span-3" />
                  </div>
                </div>
              </div>
              
              <Button>Save Account Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onSaveNotificationSettings)} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications for important events
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
                    name="checkoutAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Checkout Alerts</FormLabel>
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
        
        {/* Database Settings */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                Manage your data and backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data Backup</Label>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a backup of your database. This includes all assets, users, and configuration data.
                  </p>
                  <Button>
                    <Database className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Database Reset</Label>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Warning: This will permanently erase all data. This action cannot be undone.
                  </p>
                  <Button variant="destructive">
                    Reset Database
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure authentication and security options
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
              
              <div className="space-y-2">
                <Label>Two-Factor Authentication (2FA)</Label>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Require 2FA for all users</p>
                      <p className="text-sm text-muted-foreground">
                        Enforce two-factor authentication for added security
                      </p>
                    </div>
                    <Switch id="require-2fa" />
                  </div>
                </div>
              </div>
              
              <Button>Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
