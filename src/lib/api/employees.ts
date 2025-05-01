
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  role?: string;
  email?: string;
  avatar?: string;
  department?: string;
  hire_date?: string;
}

export interface NewEmployee {
  fullName: string;
  email: string;
  role?: string;
  department?: string;
  hire_date?: string;
}

// Get employees with tenant context
export const getEmployees = async (): Promise<Employee[]> => {
  // Get employees from the employees table with profiles
  const { data: employeesData, error: employeesError } = await supabase
    .from('employees')
    .select(`
      id,
      role,
      department,
      hire_date,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `);
  
  if (employeesError) {
    console.error("Error fetching employees:", employeesError);
    throw employeesError;
  }
  
  return (employeesData || []).map(emp => ({
    id: emp.id,
    name: emp.profiles?.full_name || '',
    role: emp.role,
    email: emp.profiles?.email,
    avatar: emp.profiles?.avatar_url,
    department: emp.department,
    hire_date: emp.hire_date
  }));
};

// Get employee by ID
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  // Find employee in employees table by ID
  const { data: employeeData, error: employeeError } = await supabase
    .from('employees')
    .select(`
      id,
      role,
      department,
      hire_date,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  
  if (employeeError) {
    console.error("Error fetching employee by ID:", employeeError);
    throw employeeError;
  }
  
  if (!employeeData) return null;
  
  return {
    id: employeeData.id,
    name: employeeData.profiles?.full_name || '',
    role: employeeData.role,
    email: employeeData.profiles?.email,
    avatar: employeeData.profiles?.avatar_url,
    department: employeeData.department,
    hire_date: employeeData.hire_date
  };
};

// Add new employee - Modified to use direct inserts instead of RPC
export const addEmployee = async (employee: NewEmployee) => {
  const { fullName, email, role, department, hire_date } = employee;
  
  try {
    console.log("Adding new employee:", employee);
    
    // First check if there's an existing user account with this email
    const { data: existingUserData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    // If user exists, create employee linked to that profile
    if (existingUserData?.id) {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert({
          profile_id: existingUserData.id,
          role: role,
          department: department || null,
          hire_date: hire_date || null
        })
        .select();
      
      if (employeeError) {
        console.error("Error creating employee record:", employeeError);
        throw employeeError;
      }
      
      return employeeData;
    }
    
    // No existing user, cannot create a profile without auth user
    throw new Error("Cannot create employee: no user account exists with email " + email);
  } catch (error) {
    console.error("Error in addEmployee:", error);
    throw error;
  }
};

// Update an employee
export const updateEmployee = async (
  employeeId: string,
  updates: Partial<NewEmployee>
) => {
  try {
    console.log("Updating employee:", employeeId, "with updates:", updates);

    // Find the employee row including profile_id
    const { data: employeeRow, error: employeeRowError } = await supabase
      .from('employees')
      .select('id, profile_id')
      .eq('id', employeeId)
      .single();

    if (employeeRowError || !employeeRow) {
      console.error("Could not find employee for updating:", employeeRowError);
      throw new Error("Could not find employee for updating.");
    }
    
    const profileId = employeeRow.profile_id;
    console.log(`Found employee record with ID ${employeeId} and profile ID ${profileId}`);

    // Update profile if relevant fields present and profile ID exists
    if (profileId && (updates.fullName || updates.email)) {
      let profileUpdate: any = {};
      if (updates.fullName) profileUpdate.full_name = updates.fullName;
      if (updates.email) profileUpdate.email = updates.email;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileUpdateErr } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', profileId);

        if (profileUpdateErr) {
          throw new Error("Failed to update employee profile: " + profileUpdateErr.message);
        }
        console.log(`Updated profile information for ${employeeId}`);
      }
    }

    // Update employee record itself (role, department, hire_date, etc)
    let employeeUpdate: any = {};
    if (updates.role) employeeUpdate.role = updates.role;
    if (updates.department) employeeUpdate.department = updates.department;
    if (updates.hire_date) employeeUpdate.hire_date = updates.hire_date;

    if (Object.keys(employeeUpdate).length > 0) {
      const { error: employeeUpdateErr } = await supabase
        .from('employees')
        .update(employeeUpdate)
        .eq('id', employeeId);

      if (employeeUpdateErr) {
        throw new Error("Failed to update employee record: " + employeeUpdateErr.message);
      }
      console.log(`Updated employee information for ${employeeId}`);
    }

    return { success: true, id: employeeId };
  } catch (error) {
    console.error("Error in updateEmployee:", error);
    throw error;
  }
};

// Import employees from CSV
export const importEmployeesFromCSV = async (headers: string[], data: string[][]) => {
  const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
  const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
  const roleIndex = headers.findIndex(h => h.toLowerCase() === 'role');
  const departmentIndex = headers.findIndex(h => h.toLowerCase() === 'department');
  const hireDateIndex = headers.findIndex(h => h.toLowerCase() === 'hire_date');
  
  if (nameIndex === -1 || emailIndex === -1) {
    throw new Error("Both 'name' and 'email' columns are required in the CSV file.");
  }
  
  // Process each row and create employees with corresponding user profiles
  const results = [];
  
  for (const row of data) {
    const name = row[nameIndex]?.trim();
    const email = row[emailIndex]?.trim();
    
    if (!name || !email) {
      continue; // Skip rows without name or email
    }
    
    const role = roleIndex !== -1 ? row[roleIndex]?.trim() : undefined;
    const department = departmentIndex !== -1 ? row[departmentIndex]?.trim() : undefined;
    const hire_date = hireDateIndex !== -1 ? row[hireDateIndex]?.trim() : undefined;
    
    try {
      // First check if there's a user profile with this email
      const { data: existingUserData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .maybeSingle();
        
      if (!existingUserData?.id) {
        // Cannot create employee without existing user account
        results.push({
          name,
          email,
          success: false,
          error: `No user account found for email: ${email}. Cannot create employee record.`
        });
        continue;
      }
      
      // Check if there's already an employee record for this profile
      const { data: existingEmployeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', existingUserData.id)
        .maybeSingle();
        
      let employeeId;
      let wasCreated = false;
      
      if (existingEmployeeData?.id) {
        // Employee exists, update it
        employeeId = existingEmployeeData.id;
        
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            role: role || null,
            department: department || null,
            hire_date: hire_date || null
          })
          .eq('id', employeeId);
          
        if (updateError) {
          throw new Error(`Failed to update existing employee: ${updateError.message}`);
        }
      } else {
        // Create new employee record linked to existing profile
        const { data: newEmployee, error: createError } = await supabase
          .from('employees')
          .insert({
            profile_id: existingUserData.id,
            role: role || null,
            department: department || null,
            hire_date: hire_date || null
          })
          .select('id')
          .single();
          
        if (createError || !newEmployee) {
          throw new Error(`Failed to create new employee record: ${createError?.message || "Unknown error"}`);
        }
        
        employeeId = newEmployee.id;
        wasCreated = true;
      }
      
      // Update profile name if it doesn't match CSV
      if (existingUserData.full_name !== name) {
        const { error: nameUpdateError } = await supabase
          .from('profiles')
          .update({ full_name: name })
          .eq('id', existingUserData.id);
          
        if (nameUpdateError) {
          console.warn(`Warning: Could not update profile name for ${email}:`, nameUpdateError);
        }
      }
      
      results.push({ 
        name, 
        email,
        success: true, 
        created: wasCreated,
        id: employeeId
      });
      
    } catch (error) {
      console.error(`Error importing employee ${name} (${email}):`, error);
      results.push({ 
        name,
        email,
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  // Check for failures and report them
  const failedImports = results.filter(r => !r.success);
  if (failedImports.length > 0) {
    const errorMessage = `Failed to import ${failedImports.length} out of ${results.length} employees.`;
    console.error(errorMessage, failedImports);
    throw new Error(errorMessage);
  }
  
  return results;
};
