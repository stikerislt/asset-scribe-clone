
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

// Get employees 
export const getEmployees = async (): Promise<Employee[]> => {
  // First check if we can get employees from the employees table
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
  
  if (employeesData && employeesData.length > 0) {
    // Map employees data to our Employee interface
    return employeesData.map(emp => ({
      id: emp.id,
      name: emp.profiles?.full_name || '',
      role: emp.role,
      email: emp.profiles?.email,
      avatar: emp.profiles?.avatar_url,
      department: emp.department,
      hire_date: emp.hire_date
    }));
  }
  
  // Fall back to the legacy approach if employees table is empty or error occurs
  const { data: assets, error } = await supabase
    .from('assets')
    .select('assigned_to')
    .not('assigned_to', 'is', null);
  
  if (error) throw error;
  
  // Get unique employee names
  const uniqueEmployees = Array.from(
    new Set(
      assets
        .filter(asset => asset.assigned_to)
        .map(asset => asset.assigned_to)
    )
  ).map(name => ({ 
    id: name as string, 
    name: name as string 
  }));
  
  // Get profiles data to merge with employees
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role');
  
  // Combine data if available
  const employeesList = uniqueEmployees.map(employee => {
    const profileMatch = profiles?.find(profile => profile.full_name === employee.name);
    if (profileMatch) {
      return {
        ...employee,
        email: profileMatch.email,
        role: profileMatch.role
      };
    }
    return employee;
  });
  
  return employeesList as Employee[];
};

// Get employee by ID
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  // First try to find employee in employees table by ID
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
  
  if (employeeData) {
    return {
      id: employeeData.id,
      name: employeeData.profiles?.full_name || '',
      role: employeeData.role,
      email: employeeData.profiles?.email,
      avatar: employeeData.profiles?.avatar_url,
      department: employeeData.department,
      hire_date: employeeData.hire_date
    };
  }
  
  // If not found by ID, check if this is a name in the assets assigned_to field
  const { data: assets } = await supabase
    .from('assets')
    .select('assigned_to')
    .eq('assigned_to', id)
    .limit(1);
  
  if (!assets || assets.length === 0) {
    return null;
  }

  // Get profile data if available
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('full_name', id)
    .limit(1);

  const profile = profiles && profiles.length > 0 ? profiles[0] : null;

  return {
    id: id,
    name: id,
    email: profile?.email,
    role: profile?.role
  };
};

// Add new employee - Modified to use RPC function for bypassing RLS
export const addEmployee = async (employee: NewEmployee) => {
  const { fullName, email, role, department, hire_date } = employee;
  
  try {
    // Using the service role key via an RPC function would be ideal here
    // For now, we'll use the available permissions
    
    // Create profile UUID
    const profileId = crypto.randomUUID();
    
    // Call admin-owned function to create the profile (would need to be implemented as an RPC)
    const { data: profileData, error: profileError } = await supabase
      .rpc('create_profile', {
        p_id: profileId,
        p_full_name: fullName,
        p_email: email,
        p_role: role
      });
    
    if (profileError) {
      console.error("Error in create_profile RPC:", profileError);
      
      // Fallback approach - try direct insert
      // This will work if either:
      // 1. You're logged in as admin
      // 2. You've set up a relaxed RLS policy for inserts
      const { data: directProfileData, error: directProfileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          full_name: fullName,
          email: email,
          role: role
        })
        .select();
      
      if (directProfileError) {
        console.error("Error in direct profile insert:", directProfileError);
        throw directProfileError;
      }
    }
    
    // Now create employee record
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .insert({
        profile_id: profileId,
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
  } catch (error) {
    console.error("Error in addEmployee:", error);
    throw error;
  }
};

// Update an employee
export const updateEmployee = async (employeeName: string, updates: Partial<NewEmployee>) => {
  try {
    // First find if this employee exists in profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('full_name', employeeName)
      .limit(1);

    if (profiles && profiles.length > 0) {
      const profileId = profiles[0].id;
      
      // Update the profile
      const profileUpdates: any = {};
      if (updates.fullName) profileUpdates.full_name = updates.fullName;
      if (updates.email) profileUpdates.email = updates.email;
      if (updates.role) profileUpdates.role = updates.role;
      
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', profileId);
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
          throw profileError;
        }
      }
      
      // Check if this profile is linked to an employee record
      const { data: employeeRecords } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', profileId)
        .limit(1);
      
      // Update or create employee record
      const employeeUpdates: any = {};
      if (updates.role) employeeUpdates.role = updates.role;
      if (updates.department) employeeUpdates.department = updates.department;
      if (updates.hire_date) employeeUpdates.hire_date = updates.hire_date;
      
      if (Object.keys(employeeUpdates).length > 0) {
        if (employeeRecords && employeeRecords.length > 0) {
          // Update existing employee record
          const { error: employeeError } = await supabase
            .from('employees')
            .update(employeeUpdates)
            .eq('profile_id', profileId);
          
          if (employeeError) {
            console.error("Error updating employee record:", employeeError);
            throw employeeError;
          }
        } else {
          // Create new employee record
          const { error: newEmployeeError } = await supabase
            .from('employees')
            .insert([{
              profile_id: profileId,
              ...employeeUpdates
            }]);
          
          if (newEmployeeError) {
            console.error("Error creating employee record:", newEmployeeError);
            throw newEmployeeError;
          }
        }
      }

      // If name was updated, also update assets references
      if (updates.fullName && updates.fullName !== employeeName) {
        const { error: assetsError } = await supabase
          .from('assets')
          .update({ assigned_to: updates.fullName })
          .eq('assigned_to', employeeName);
        
        if (assetsError) throw assetsError;
      }
      
      return { success: true };
    } else {
      // Create a new profile if it doesn't exist
      try {
        const result = await addEmployee({
          fullName: updates.fullName || employeeName,
          email: updates.email || '',
          role: updates.role,
          department: updates.department,
          hire_date: updates.hire_date
        });
        return result;
      } catch (error) {
        console.error("Error creating new employee:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Error updating employee:", error);
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
  
  if (nameIndex === -1) {
    throw new Error("The 'name' column is required in the CSV file.");
  }
  
  // Process each row and create/update employees
  const results = [];
  for (const row of data) {
    const name = row[nameIndex]?.trim();
    if (!name) continue; // Skip rows without a name
    
    const email = emailIndex !== -1 ? row[emailIndex]?.trim() : undefined;
    const role = roleIndex !== -1 ? row[roleIndex]?.trim() : undefined;
    const department = departmentIndex !== -1 ? row[departmentIndex]?.trim() : undefined;
    const hire_date = hireDateIndex !== -1 ? row[hireDateIndex]?.trim() : undefined;
    
    try {
      await updateEmployee(name, { fullName: name, email, role, department, hire_date });
      results.push({ name, success: true });
    } catch (error) {
      console.error(`Error importing employee ${name}:`, error);
      results.push({ name, success: false, error });
    }
  }
  
  const failedImports = results.filter(r => !r.success);
  if (failedImports.length > 0) {
    throw new Error(`Failed to import ${failedImports.length} employees.`);
  }
  
  return results;
};
