
import { z } from "zod";

export const organizationSizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501+ employees"
] as const;

export const industries = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "Manufacturing",
  "Retail",
  "Other"
] as const;

export const tenantSetupSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  industry: z.enum(industries),
  organizationSize: z.enum(organizationSizes)
});

export type TenantSetupValues = z.infer<typeof tenantSetupSchema>;
