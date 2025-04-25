import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertCircle, Crown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().optional(),
  role: z.enum(["Admin", "Manager", "User"], {
    required_error: "Please select a user role.",
  }),
  active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

interface UserFormProps {
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
  error?: string;
  isSubmitting: boolean;
  defaultValues?: Partial<UserFormValues>;
  isEditMode?: boolean;
  isOwner?: boolean;
}

export function UserForm({ onSubmit, onCancel, error, isSubmitting, defaultValues, isEditMode = false, isOwner = false }: UserFormProps) {
  const schema = isEditMode 
    ? userFormSchema.omit({ password: true }).merge(
        z.object({
          password: z.string().optional()
        })
      )
    : userFormSchema;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: isOwner && defaultValues 
      ? { ...defaultValues, role: "Admin" }
      : defaultValues || {
          name: "",
          email: "",
          password: "",
          role: "User",
          active: true,
        },
  });

  const handleSubmit = async (values: UserFormValues) => {
    try {
      if (isOwner) {
        values.role = "Admin";
      }
      await onSubmit(values);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter user's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="user@example.com" 
                  {...field} 
                />
              </FormControl>
              {!isEditMode && (
                <FormDescription>
                  User will receive an invitation at this email address.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditMode ? "New Password (optional)" : "Password"}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={isEditMode ? "Leave blank to keep current password" : "Enter a strong password"}
                  {...field} 
                />
              </FormControl>
              {!isEditMode && (
                <FormDescription>
                  Must be at least 6 characters.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>User Role</FormLabel>
                {isOwner && (
                  <span className="inline-flex items-center text-amber-600 text-sm">
                    <Crown className="h-3.5 w-3.5 mr-1" />
                    Organization Owner
                  </span>
                )}
              </div>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
                disabled={isOwner}
              >
                <FormControl>
                  <SelectTrigger className={isOwner ? "bg-amber-50" : ""}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                {isOwner 
                  ? "Organization owners automatically have Admin privileges." 
                  : "The user's permission level in the system."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Account</FormLabel>
                <FormDescription>
                  User will be able to log in if active.
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
            {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update User" : "Create User")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
