
/**
 * Parse CSV string to array of arrays for preview
 */
export const parseCSVForPreview = (csv: string): { headers: string[], data: string[][] } => {
  if (!csv || csv.trim() === '') return { headers: [], data: [] };
  
  const lines = csv.split('\n');
  if (lines.length === 0) return { headers: [], data: [] };
  
  const headers = parseCSVLine(lines[0]);
  
  const data = lines.slice(1)
    .filter(line => line.trim() !== '')
    .map(line => parseCSVLine(line));
  
  return { headers, data };
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
