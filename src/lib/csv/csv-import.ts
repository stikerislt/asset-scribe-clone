
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
