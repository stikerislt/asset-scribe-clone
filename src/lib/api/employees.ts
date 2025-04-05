import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  role?: string;
  email?: string;
  avatar?: string;
}

export interface NewEmployee {
  fullName: string;
  email: string;
  role?: string;
}

// Get employees 
export const getEmployees = async (): Promise<Employee[]> => {
  // First get all assigned_to values from assets
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
    .select('id, full_name, email');
  
  // Combine data if available
  const employeesList = uniqueEmployees.map(employee => {
    const profileMatch = profiles?.find(profile => profile.full_name === employee.name);
    if (profileMatch) {
      return {
        ...employee,
        email: profileMatch.email
      };
    }
    return employee;
  });
  
  return employeesList as Employee[];
};

// Get employee by ID (name)
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  // First check if this is a name in the assets assigned_to field
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
    .select('id, full_name, email')
    .eq('full_name', id)
    .limit(1);

  const profile = profiles && profiles.length > 0 ? profiles[0] : null;

  return {
    id: id,
    name: id,
    email: profile?.email,
    // Role would need to be added to profiles table if needed
  };
};

// Add new employee
export const addEmployee = async (employee: NewEmployee) => {
  const { fullName, email, role } = employee;
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      { 
        id: crypto.randomUUID(), // Generate a random UUID for the profile
        full_name: fullName,
        email: email
      }
    ])
    .select();
  
  if (error) throw error;
  return data;
};

// Update an employee
export const updateEmployee = async (employeeName: string, updates: Partial<NewEmployee>) => {
  // First find if this employee exists in profiles table
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('full_name', employeeName)
    .limit(1);

  if (profiles && profiles.length > 0) {
    // Update existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName || employeeName,
        email: updates.email
      })
      .eq('full_name', employeeName)
      .select();
    
    if (error) throw error;

    // If name was updated, also update assets references
    if (updates.fullName && updates.fullName !== employeeName) {
      const { error: assetsError } = await supabase
        .from('assets')
        .update({ assigned_to: updates.fullName })
        .eq('assigned_to', employeeName);
      
      if (assetsError) throw assetsError;
    }
    
    return data;
  } else {
    // Create a new profile if it doesn't exist
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          id: crypto.randomUUID(),
          full_name: updates.fullName || employeeName,
          email: updates.email
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  }
};

// Import employees from CSV
export const importEmployeesFromCSV = async (headers: string[], data: string[][]) => {
  const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
  const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
  const roleIndex = headers.findIndex(h => h.toLowerCase() === 'role');
  
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
    
    try {
      // Check if employee already exists
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('full_name', name)
        .limit(1);
      
      if (existingProfiles && existingProfiles.length > 0) {
        // Update existing profile
        await supabase
          .from('profiles')
          .update({
            email: email || existingProfiles[0].email,
          })
          .eq('full_name', name);
      } else {
        // Create new profile
        await supabase
          .from('profiles')
          .insert([
            {
              id: crypto.randomUUID(),
              full_name: name,
              email,
            }
          ]);
      }
      
      results.push({ name, success: true });
    } catch (error) {
      results.push({ name, success: false, error });
    }
  }
  
  const failedImports = results.filter(r => !r.success);
  if (failedImports.length > 0) {
    throw new Error(`Failed to import ${failedImports.length} employees.`);
  }
  
  return results;
};
