
// CSV export/import utility functions

/**
 * Converts an array of objects to CSV format with UTF-8 support
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
      // Escape quotes and wrap in quotes if contains comma, quotes, or special characters
      if (value.includes(',') || value.includes('"') || value.includes('\n') || /[^\x00-\x7F]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Parse CSV string to array of objects with UTF-8 support
 */
export const csvToObjects = <T extends Record<string, any>>(csv: string): T[] => {
  if (!csv || csv.trim() === '') return [];
  
  const lines = csv.split('\n');
  if (lines.length <= 1) return [];
  
  // Parse header line using parseCSVLine for better UTF-8 support
  const headers = parseCSVLine(lines[0]);
  
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
 * Parse a CSV line, handling quoted values with commas and UTF-8 characters
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
    'tag',           // Asset tag identifier
    'name',          // Asset name
    'category',      // Asset category
    'status',        // Asset status (valid values: ready, deployed, maintenance, retired)
    'assigned_to',   // Person assigned to
    'model',         // Model information
    'serial',        // Serial number
    'purchase_date', // Purchase date
    'purchase_cost', // Purchase cost
    'location',      // Physical location
    'wear',          // Expected years until asset needs replacement (for budgeting)
    'notes',         // Additional notes
    'status_color',  // Status color (green, yellow, red)
    'qty'            // Quantity of the asset
  ];
  
  // Example row with default values for required fields
  const exampleRow = templateHeaders.map(header => {
    if (header === 'tag') return 'ASSET-001';
    if (header === 'name') return 'Sample Asset';
    if (header === 'category') return 'General'; 
    if (header === 'status') return 'ready';  // Valid status values: ready, deployed, maintenance, retired
    if (header === 'wear') return '3';        // Example: 3 years until replacement
    if (header === 'qty') return '1';         // Default quantity is 1
    return '';
  });
  
  return [templateHeaders.join(','), exampleRow.join(',')].join('\n');
};

/**
 * Parse CSV file content for preview
 */
export const parseCSV = (content: string): { headers: string[], data: string[][] } => {
  // Regular CSV parsing
  if (!content || content.trim() === '') return { headers: [], data: [] };
  
  const lines = content.split('\n');
  if (lines.length === 0) return { headers: [], data: [] };
  
  const headers = parseCSVLine(lines[0]);
  
  const data = lines.slice(1)
    .filter(line => line.trim() !== '')
    .map(line => parseCSVLine(line));
  
  return { headers, data };
};

/**
 * Download CSV file with specified headers and data
 */
export const downloadCSV = (headers: string[], data: string[][], filename: string = 'export') => {
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n');
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  // Add to document, trigger download, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
