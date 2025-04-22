
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
  
  // Fall back to the legacy approach if employees table is empty
  const { data: assets, error } = await supabase
    .from('assets')
    .select('assigned_to')
    .not('assigned_to', 'is', null);
  
  if (error) throw error;
  
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
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role');
  
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

// Add new employee - Modified to use direct inserts instead of RPC
export const addEmployee = async (employee: NewEmployee) => {
  const { fullName, email, role, department, hire_date } = employee;
  
  try {
    console.log("Adding new employee:", employee);
    
    // Create profile UUID
    const profileId = crypto.randomUUID();
    
    // Insert profile directly
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        full_name: fullName,
        email: email,
        role: role
      })
      .select();
    
    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
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

// Find employee ID by name - helper function to resolve name to UUID
export const findEmployeeIdByName = async (fullName: string): Promise<string | null> => {
  console.log(`Looking up employee ID for name: ${fullName}`);
  
  // First check if the employee exists in the employees+profiles tables
  const { data: employeeData } = await supabase
    .from('employees')
    .select(`
      id,
      profiles!inner (
        full_name
      )
    `)
    .eq('profiles.full_name', fullName)
    .limit(1)
    .maybeSingle();
    
  if (employeeData) {
    console.log(`Found employee ID ${employeeData.id} for ${fullName} in modern tables`);
    return employeeData.id;
  }
  
  // If not found in employees table, check if they exist in the legacy assigned_to field
  // This is just to verify if they exist in legacy data
  const { data: assets } = await supabase
    .from('assets')
    .select('assigned_to')
    .eq('assigned_to', fullName)
    .limit(1);
    
  if (assets && assets.length > 0) {
    console.log(`Found employee ${fullName} in legacy data but no modern record exists`);
    return null; // Return null to indicate we need to create a new record
  }
  
  console.log(`Employee ${fullName} not found in any tables`);
  return null;
};

// Update an employee
export const updateEmployee = async (
  employeeId: string, // Accept employeeId (uuid) or name (string)
  updates: Partial<NewEmployee>
) => {
  try {
    console.log("Updating employee:", employeeId, "with updates:", updates);

    // Check if employeeId is a UUID (modern) or a name (legacy)
    let isUuid = false;
    try {
      // Test if the ID is a valid UUID
      const uuid = employeeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      isUuid = !!uuid;
    } catch (e) {
      isUuid = false;
    }

    let targetEmployeeId = employeeId;
    let profileId: string | null = null;

    if (!isUuid) {
      // This is a name, not a UUID - we need to find or create the proper employee record
      console.log(`Employee ID ${employeeId} appears to be a name, not UUID. Looking up or creating employee.`);
      
      // First attempt to find the employee by name
      const existingEmployeeId = await findEmployeeIdByName(employeeId);
      
      if (existingEmployeeId) {
        targetEmployeeId = existingEmployeeId;
      } else {
        // No existing employee found, we need to create a new employee record
        console.log(`No existing employee found for ${employeeId}. Creating new employee record.`);
        
        // Create a new profile record
        const newProfileId = crypto.randomUUID();
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newProfileId,
            full_name: employeeId, // Use the name provided
            email: updates.email || null,
            role: updates.role || null
          });
          
        if (profileError) {
          console.error("Error creating profile for new employee:", profileError);
          throw new Error("Could not create profile for new employee: " + profileError.message);
        }
        
        // Create a new employee record linked to the profile
        const { data: newEmployee, error: employeeError } = await supabase
          .from('employees')
          .insert({
            profile_id: newProfileId,
            role: updates.role || null,
            department: updates.department || null,
            hire_date: updates.hire_date || null
          })
          .select('id')
          .single();
          
        if (employeeError || !newEmployee) {
          console.error("Error creating employee record:", employeeError);
          throw new Error("Could not create employee record: " + (employeeError?.message || "Unknown error"));
        }
        
        console.log(`Created new employee with ID ${newEmployee.id} for ${employeeId}`);
        return { success: true, created: true, id: newEmployee.id };
      }
    }

    // At this point we have a valid employee UUID in targetEmployeeId
    // Find the employee row including profile_id
    const { data: employeeRow, error: employeeRowError } = await supabase
      .from('employees')
      .select('id, profile_id')
      .eq('id', targetEmployeeId)
      .single();

    if (employeeRowError || !employeeRow) {
      console.error("Could not find employee for updating:", employeeRowError);
      throw new Error("Could not find employee for updating.");
    }
    
    profileId = employeeRow.profile_id;
    console.log(`Found employee record with ID ${targetEmployeeId} and profile ID ${profileId}`);

    // Update profile if relevant fields present (full_name, email, role)
    if (updates.fullName || updates.email || updates.role) {
      // Only update fields that are actually provided
      let profileUpdate: any = {};
      if (updates.fullName) profileUpdate.full_name = updates.fullName;
      if (updates.email) profileUpdate.email = updates.email;
      if (updates.role) profileUpdate.role = updates.role;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileUpdateErr } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', profileId);

        if (profileUpdateErr) {
          throw new Error("Failed to update employee profile: " + profileUpdateErr.message);
        }
        console.log(`Updated profile information for ${targetEmployeeId}`);
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
        .eq('id', targetEmployeeId);

      if (employeeUpdateErr) {
        throw new Error("Failed to update employee record: " + employeeUpdateErr.message);
      }
      console.log(`Updated employee information for ${targetEmployeeId}`);
    }

    return { success: true, id: targetEmployeeId };
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
      // Instead of directly calling updateEmployee with a name, find or create the employee first
      console.log(`Importing employee: ${name}`);
      const result = await updateEmployee(name, { 
        fullName: name, 
        email, 
        role, 
        department, 
        hire_date 
      });
      
      results.push({ 
        name, 
        success: true, 
        created: result.created || false,
        id: result.id
      });
      
    } catch (error) {
      console.error(`Error importing employee ${name}:`, error);
      results.push({ 
        name, 
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
