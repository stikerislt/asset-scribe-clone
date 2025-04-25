
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const updatePasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

interface UpdatePasswordFormProps {
  isInviteFlow?: boolean;
}

const UpdatePasswordForm = ({ isInviteFlow = false }: UpdatePasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (data: UpdatePasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      
      if (error) {
        throw error;
      }

      toast({
        title: isInviteFlow ? "Account setup complete" : "Password updated",
        description: isInviteFlow 
          ? "Your password has been set and you can now access the system." 
          : "Your password has been updated successfully.",
      });
      
      // Redirect to appropriate page
      if (isInviteFlow) {
        // For invited users, go to onboarding or dashboard
        const { data: onboardingComplete, error: checkError } = await supabase.rpc('has_completed_onboarding', {
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
        
        if (checkError) {
          console.error("Error checking onboarding status:", checkError);
          setTimeout(() => navigate("/dashboard"), 1500);
        } else {
          setTimeout(() => navigate(onboardingComplete ? "/dashboard" : "/onboarding"), 1500);
        }
      } else {
        // For password reset, go to login
        setTimeout(() => navigate("/auth/login"), 1500);
      }
    } catch (error) {
      toast({
        title: "Failed to update password",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="text-center space-y-2 mb-4">
          <h3 className="text-lg font-medium">
            {isInviteFlow ? "Create your password" : "Create a new password"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isInviteFlow 
              ? "To access your team's workspace, please create a secure password for your account." 
              : "Enter a new secure password for your account."}
          </p>
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting 
            ? (isInviteFlow ? "Setting up..." : "Updating...") 
            : (isInviteFlow ? "Set Password & Continue" : "Update Password")}
        </Button>
      </form>
    </Form>
  );
};

export default UpdatePasswordForm;
