
// CSV export/import utility functions

/**
 * Converts an array of objects to CSV format
 */
export const objectsToCSV = <T extends Record<string, any>>(data: T[]): string => {
  if (data.length === 0) return '';
  
  // Get all headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Handle special characters and quotes in CSV
      const value = item[header] === null || item[header] === undefined ? '' : String(item[header]);
      // Escape quotes and wrap in quotes if contains comma or quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Parse CSV string to array of objects
 */
export const csvToObjects = <T extends Record<string, any>>(csv: string): T[] => {
  if (!csv || csv.trim() === '') return [];
  
  const lines = csv.split('\n');
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const values = parseCSVLine(line);
      const obj: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      return obj as T;
    });
};

/**
 * Parse a CSV line, handling quoted values with commas
 */
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check for escaped quotes (double quotes)
      if (i < line.length - 1 && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current); // Add the last value
  return values;
};

/**
 * Generate a template CSV for asset imports
 */
export const generateAssetImportTemplate = (): string => {
  // Template headers in the exact order specified
  const templateHeaders = [
    'tag',           // IN
    'name',          // Name
    'serial',        // Serial
    'category',      // Category
    'notes',         // Notes
    'status',        // Status
    'purchase_date', // Purchase_Date
    'purchase_cost', // Purchase_Cost
    'assigned_to'    // Assigned_To
  ];
  
  // Example row with empty values
  const exampleRow = templateHeaders.map(() => '');
  
  return [templateHeaders.join(','), exampleRow.join(',')].join('\n');
};
