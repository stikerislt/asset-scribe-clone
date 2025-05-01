
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
): Promise<{ 
  created: number;
  existing: number;
  errors: string[];
}> {
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
              department: 'Imported from Assets'
            });
            
          if (createError) throw createError;
          result.created++;
        }
      } else {
        // No matching profile found, create a placeholder profile
        // Generate an email based on the name (this is just a placeholder)
        const placeholderEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`;
        
        // Insert a new placeholder profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            full_name: name,
            email: placeholderEmail,
            // Generate a random UUID for the profile ID since we're not creating an auth user
            id: crypto.randomUUID()
          })
          .select()
          .single();
          
        if (profileError) throw profileError;
        
        // Create employee record linked to new placeholder profile
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            profile_id: newProfile.id,
            tenant_id: tenantId,
            department: 'Auto-generated from Assets'
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
