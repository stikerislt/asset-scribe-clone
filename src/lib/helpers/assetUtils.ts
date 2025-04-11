
import { Asset } from "@/lib/api/assets";
import { Filters } from "@/components/assets/AssetFilters";

export const getFilterOptions = (assets: Asset[], key: keyof Asset) => {
  if (!assets?.length) return [];
  
  const uniqueValues = Array.from(new Set(
    assets
      .map(asset => asset[key])
      .filter(Boolean)
  )).sort();
  
  return uniqueValues.map(value => String(value));
};

export const filterAssets = (assets: Asset[], searchTerm: string, activeFilters: Filters) => {
  // First filter assets based on search and filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      (asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       asset?.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       asset?.category?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    const tagMatch = activeFilters.tag.length === 0 || 
      (asset.tag && activeFilters.tag.includes(asset.tag));
    
    const nameMatch = activeFilters.name.length === 0 || 
      (asset.name && activeFilters.name.includes(asset.name));
    
    const categoryMatch = activeFilters.category.length === 0 || 
      (asset.category && activeFilters.category.includes(asset.category));
    
    const assignedToMatch = activeFilters.assignedTo.length === 0 || 
      (asset.assigned_to && activeFilters.assignedTo.includes(asset.assigned_to));
    
    const purchaseDateMatch = activeFilters.purchaseDate.length === 0 || 
      (asset.purchase_date && 
       activeFilters.purchaseDate.includes(new Date(asset.purchase_date).toLocaleDateString()));
    
    const wearMatch = activeFilters.wear.length === 0 || 
      (asset.wear && activeFilters.wear.includes(asset.wear));
    
    const costMatch = activeFilters.purchaseCost.length === 0 || 
      (asset.purchase_cost && 
       activeFilters.purchaseCost.includes(`$${asset.purchase_cost.toFixed(2)}`));
    
    return tagMatch && nameMatch && categoryMatch && assignedToMatch && purchaseDateMatch && wearMatch && costMatch;
  });
  
  // Then sort to prioritize yellow status_color
  return filteredAssets.sort((a, b) => {
    // First prioritize yellow status
    if (a.status_color === 'yellow' && b.status_color !== 'yellow') return -1;
    if (a.status_color !== 'yellow' && b.status_color === 'yellow') return 1;
    
    // If both have same priority, maintain existing order
    return 0;
  });
};

export const debugAssetAccess = async () => {
  const { debugRlsAccess } = await import('@/integrations/supabase/client');
  
  try {
    const result = await debugRlsAccess();
    console.log("Debug result:", result);
    return result;
  } catch (e) {
    console.error("Debug error:", e);
    throw e;
  }
};
