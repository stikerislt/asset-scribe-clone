import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Loader2, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useActivity } from "@/hooks/useActivity";

const organizationSizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501+ employees"
] as const;

const industries = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "Manufacturing",
  "Retail",
  "Other"
] as const;

const tenantSetupSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  industry: z.enum(industries),
  organizationSize: z.enum(organizationSizes)
});

type TenantSetupValues = z.infer<typeof tenantSetupSchema>;

interface TenantSetupDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TenantSetupDialog({ isOpen, onComplete }: TenantSetupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();
  const { logActivity } = useActivity();

  const form = useForm<TenantSetupValues>({
    resolver: zodResolver(tenantSetupSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      industry: "Technology",
      organizationSize: "1-10 employees"
    }
  });

  const onSubmit = async (data: TenantSetupValues) => {
    if (!user) {
      toast.error("You must be logged in to create an organization");
      return;
    }
    
    setIsSubmitting(true);
    setHasError(false);
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setIsSubmitting(false);
      toast.error("Authentication error. Please try logging in again.");
      return;
    }

    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.name,
          description: data.description || null,
          website: data.website || null,
          industry: data.industry,
          organization_size: data.organizationSize,
          owner_id: currentUser.id
        })
        .select();

      if (tenantError) {
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      if (!tenantData || tenantData.length === 0) {
        throw new Error("No data returned after tenant creation");
      }

      const newTenantId = tenantData[0].id;

      const { error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert({
          tenant_id: newTenantId,
          user_id: currentUser.id,
          role: 'admin',
          is_primary: true,
          is_owner: true
        });

      if (membershipError) {
        throw new Error(`Failed to create membership: ${membershipError.message}`);
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: currentUser.id,
          role: 'admin'
        });

      if (roleError) {
        throw new Error(`Failed to create user role: ${roleError.message}`);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', currentUser.id);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      await logActivity({
        title: "Organization Created",
        description: `Created organization ${data.name}`,
        category: 'system'
      });

      toast.success("Organization created successfully!");
      onComplete();
    } catch (error: any) {
      console.error("[TenantSetupDialog] Error during organization setup:", error);
      setHasError(true);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !hasError) {
        console.log("[TenantSetupDialog] Attempted to close dialog");
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create your organization</DialogTitle>
          <DialogDescription>
            Set up your organization to get started with the platform.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of your organization" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Size *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Organization...
                </>
              ) : hasError ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry
                </>
              ) : (
                <>
                  <Building className="mr-2 h-4 w-4" />
                  Create Organization
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
