
import * as XLSX from 'xlsx';

/**
 * Parse CSV or Excel file content for preview
 */
export const parseCSVForPreview = (content: string, fileType: 'csv' | 'excel'): { headers: string[], data: string[][] } => {
  if (fileType === 'excel') {
    return parseExcelForPreview(content);
  }
  
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
 * Parse Excel data from base64 string
 */
const parseExcelForPreview = (base64Content: string): { headers: string[], data: string[][] } => {
  try {
    // Convert base64 to array buffer
    const binaryString = window.atob(base64Content.split(',')[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Read the Excel file
    const workbook = XLSX.read(bytes, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
    
    // Extract headers and data, ensuring all values are strings
    if (jsonData.length === 0) return { headers: [], data: [] };
    
    // Safely convert headers to strings
    const headers = (jsonData[0] || []).map(h => 
      h === null || h === undefined ? '' : String(h)
    );
    
    // Safely convert all data cells to strings
    const data = (jsonData.slice(1) || []).map(row => {
      if (!Array.isArray(row)) return [];
      return row.map(cell => 
        cell === null || cell === undefined ? '' : String(cell)
      );
    });
    
    return { headers, data };
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return { headers: [], data: [] };
  }
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
