
/**
 * Parse a CSV line, handling quoted values with commas and UTF-8 characters
 */
export const parseCSVLine = (line: string): string[] => {
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
