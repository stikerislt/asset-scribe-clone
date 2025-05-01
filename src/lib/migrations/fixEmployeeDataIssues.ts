
import { supabase } from "@/integrations/supabase/client";

/**
 * One-time migration to fix employee data issues:
 * - Extract names from role field when it contains "Asset assigned to: [Name]"
 * - Create profiles for employees that don't have them
 * - Fix role values to be proper roles (user, manager, admin)
 * - Clear auto-generated department values
 */
export const fixEmployeeDataIssues = async (): Promise<{
  fixed: number;
  errors: string[];
}> => {
  console.log("Starting employee data cleanup...");
  
  const result = {
    fixed: 0,
    errors: [] as string[]
  };

  try {
    // 1. Get all employees
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('*');
      
    if (fetchError) throw fetchError;
    
    if (!employees || employees.length === 0) {
      console.log("No employees to process");
      return result;
    }
    
    console.log(`Found ${employees.length} employees to process`);
    
    // 2. Process each employee
    for (const employee of employees) {
      try {
        let needsUpdate = false;
        const updates: any = {};
        
        // Check if role contains "Asset assigned to:" format
        if (employee.role && employee.role.startsWith("Asset assigned to:")) {
          // Extract the name from the role
          const nameFromRole = employee.role.replace("Asset assigned to:", "").trim();
          console.log(`Employee ${employee.id} has name in role field: "${nameFromRole}"`);
          
          // Reset role to "user"
          updates.role = "user";
          needsUpdate = true;
          
          // Check if this employee has a profile
          if (!employee.profile_id) {
            // Need to create a profile for this employee
            const newProfileId = crypto.randomUUID();
            
            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: newProfileId,
                full_name: nameFromRole,
                email: null
              });
              
            if (profileError) {
              throw new Error(`Failed to create profile for employee ${employee.id}: ${profileError.message}`);
            }
            
            // Link employee to new profile
            updates.profile_id = newProfileId;
          } else {
            // Check if the profile exists
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', employee.profile_id)
              .single();
              
            if (!profile || !profile.full_name) {
              // Update the profile name
              const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ full_name: nameFromRole })
                .eq('id', employee.profile_id);
                
              if (updateProfileError) {
                throw new Error(`Failed to update profile name for employee ${employee.id}: ${updateProfileError.message}`);
              }
            }
          }
        }
        
        // Check for auto-generated department text
        if (employee.department && employee.department.toLowerCase().includes('auto-generated')) {
          updates.department = null;
          needsUpdate = true;
        }
        
        // Update the employee if needed
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', employee.id);
            
          if (updateError) {
            throw new Error(`Failed to update employee ${employee.id}: ${updateError.message}`);
          }
          
          result.fixed++;
        }
      } catch (error) {
        const errorMessage = `Error fixing employee ${employee.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        result.errors.push(errorMessage);
      }
    }
    
    console.log(`Fixed ${result.fixed} employees`);
    if (result.errors.length > 0) {
      console.warn(`Encountered ${result.errors.length} errors during cleanup`);
    }
    
    return result;
  } catch (error) {
    const errorMessage = `Error in fixEmployeeDataIssues: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    result.errors.push(errorMessage);
    return result;
  }
};

// One-time migration function to run on app initialization or admin action
export const runEmployeeDataMigration = async () => {
  try {
    const result = await fixEmployeeDataIssues();
    return {
      success: true,
      message: `Fixed ${result.fixed} employee records`,
      errors: result.errors
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: []
    };
  }
};
