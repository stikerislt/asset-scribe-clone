
import { VALID_ASSET_STATUSES, AssetStatus } from "@/lib/api/assets";
import { StatusColor } from "@/lib/data";

/**
 * Validate imported CSV data against expected fields for assets
 */
export const validateAssetCSV = (headers: string[], data: string[][]): { valid: boolean, errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = ['name', 'tag', 'category', 'status'];
  
  // Check for required headers
  const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim());
  const missingFields = requiredFields.filter(field => 
    !lowerCaseHeaders.includes(field.toLowerCase())
  );
  
  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate data rows
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Check if row has correct number of columns
    if (row.length !== headers.length) {
      errors.push(`Row ${rowNumber}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
    }
    
    // Check for empty required values
    requiredFields.forEach(field => {
      const fieldIndex = lowerCaseHeaders.indexOf(field.toLowerCase());
      if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === '')) {
        errors.push(`Row ${rowNumber}: Missing required value for "${field}"`);
      }
    });
    
    // Validate status field has allowed values
    const statusIndex = lowerCaseHeaders.indexOf('status');
    if (statusIndex !== -1) {
      const status = row[statusIndex]?.toLowerCase(); // Convert status to lowercase
      if (status && !VALID_ASSET_STATUSES.includes(status as AssetStatus)) {
        errors.push(`Row ${rowNumber}: Invalid status "${row[statusIndex]}". Valid options: ${VALID_ASSET_STATUSES.join(', ')}`);
      }
    }
    
    // Validate status_color field has allowed values
    const statusColorIndex = lowerCaseHeaders.indexOf('status_color');
    if (statusColorIndex !== -1 && row[statusColorIndex]) {
      const color = row[statusColorIndex].toLowerCase();
      if (color && !['green', 'yellow', 'red'].includes(color)) {
        errors.push(`Row ${rowNumber}: Invalid status color "${row[statusColorIndex]}". Valid options: green, yellow, red`);
      }
    }
    
    // Validate numeric fields
    const qtyIndex = lowerCaseHeaders.indexOf('qty');
    if (qtyIndex !== -1 && row[qtyIndex] && !/^\d+$/.test(row[qtyIndex])) {
      errors.push(`Row ${rowNumber}: Quantity must be a number`);
    }
    
    const costIndex = lowerCaseHeaders.indexOf('purchase_cost');
    if (costIndex !== -1 && row[costIndex] && !/^\d+(\.\d+)?$/.test(row[costIndex])) {
      errors.push(`Row ${rowNumber}: Purchase cost must be a number`);
    }
  });
  
  return { valid: errors.length === 0, errors };
};
