
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
