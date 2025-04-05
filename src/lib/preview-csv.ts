
import * as XLSX from 'xlsx';
import { parseCSVLine, parseCSV } from './csv/csv-parser';

/**
 * Parse CSV or Excel file content for preview
 */
export const parseCSVForPreview = (content: string, fileType: 'csv' | 'excel'): { headers: string[], data: string[][] } => {
  if (fileType === 'excel') {
    return parseExcelForPreview(content);
  }
  
  // For CSV files, use our parser
  return parseCSV(content);
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
 * Detect file type and parse accordingly
 */
export const parseFileForPreview = (file: File): Promise<{ headers: string[], data: string[][], fileType: 'csv' | 'excel' }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Determine file type based on extension
    const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
    
    if (fileType === 'csv') {
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const result = parseCSVForPreview(csvText, 'csv');
          resolve({ ...result, fileType });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const result = parseCSVForPreview(e.target?.result as string, 'excel');
          resolve({ ...result, fileType });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    }
  });
};
