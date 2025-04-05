
/**
 * Generate a template CSV for employee imports
 */
export const generateEmployeeImportTemplate = (): string => {
  // Template headers in the exact order specified
  const templateHeaders = [
    'name',        // Employee's full name
    'email',       // Employee's email address
    'role',        // Employee's role or position
  ];
  
  // Example row with default values
  const exampleRow = templateHeaders.map(header => {
    if (header === 'name') return 'John Doe';
    if (header === 'email') return 'john.doe@example.com';
    if (header === 'role') return 'IT Manager';
    return '';
  });
  
  return [templateHeaders.join(','), exampleRow.join(',')].join('\n');
};
