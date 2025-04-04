
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  role?: string;
  email?: string;
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
