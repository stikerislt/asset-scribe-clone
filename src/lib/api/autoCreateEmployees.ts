
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates employee records based on asset assignments
 * @param assignedToNames Array of unique names from asset assigned_to fields
 * @param tenantId The current tenant ID
 * @returns Object containing success and error counts
 */
export const createEmployeesFromAssetAssignments = async (
  assignedToNames: string[], 
  tenantId: string
) => {
  if (!assignedToNames || assignedToNames.length === 0) {
    return { created: 0, existing: 0, errors: [] };
  }

  console.log(`Attempting to create ${assignedToNames.length} employees from asset assignments`);
  
  const result = {
    created: 0,
    existing: 0,
    errors: [] as string[]
  };

  // Process each unique assigned_to value
  for (const assignedName of assignedToNames) {
    if (!assignedName || assignedName.trim() === '') continue;
    
    try {
      // Clean up the name
      const name = assignedName.trim();
      
      // 1. Check if employee already exists with this name by checking profiles
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', name)
        .limit(1);
        
      // If we found a matching profile, check if there's an employee record
      if (existingProfiles && existingProfiles.length > 0) {
        const profileId = existingProfiles[0].id;
        
        // Check if this profile already has an employee record
        const { data: existingEmployee } = await supabase
          .from('employees')
          .select('id')
          .eq('profile_id', profileId)
          .eq('tenant_id', tenantId)
          .maybeSingle();
          
        if (existingEmployee) {
          // Employee already exists
          result.existing++;
          continue;
        } else {
          // Create employee record linked to existing profile
          const { error: createError } = await supabase
            .from('employees')
            .insert({
              profile_id: profileId,
              tenant_id: tenantId,
              role: 'user' // Default role to 'user'
            });
            
          if (createError) throw createError;
          result.created++;
        }
      } else {
        // No matching profile found - we need to generate a UUID for the new profile
        // Generate a UUID for the new profile
        const newProfileId = crypto.randomUUID();
        
        // Create a new profile with the generated ID
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newProfileId,  // Use the generated UUID
            full_name: name,
            email: null
          });
          
        if (profileError) {
          throw new Error("Failed to create profile for " + name + ": " + profileError.message);
        }
        
        // Now create the employee record linked to the new profile
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            profile_id: newProfileId,  // Use the same UUID
            tenant_id: tenantId,
            role: 'user', // Default role
            department: null // No default department
          });
          
        if (employeeError) throw employeeError;
        result.created++;
      }
    } catch (error) {
      console.error(`Error creating employee for "${assignedName}":`, error);
      result.errors.push(`Failed to create employee for "${assignedName}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return result;
};
