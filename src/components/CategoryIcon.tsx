
import React from "react";
import { Archive, Smartphone, Globe, Tablet, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: string;
  className?: string;
  size?: number;
}

export const CategoryIcon = ({ category, className, size = 18 }: CategoryIconProps) => {
  const categoryLower = category?.toLowerCase() || "";
  
  // Map category names to icons (including translations)
  const getIcon = () => {
    // Check both english and localized versions
    if (categoryLower.includes("inventory") || categoryLower.includes("inventorius")) {
      return <Archive size={size} className={cn("text-blue-600", className)} />;
    }
    
    if (categoryLower.includes("mobile") || categoryLower.includes("phone") || 
        categoryLower.includes("telefonas")) {
      return <Smartphone size={size} className={cn("text-green-600", className)} />;
    }
    
    if (categoryLower.includes("web") || categoryLower.includes("svetainė") || 
        categoryLower.includes("website")) {
      return <Globe size={size} className={cn("text-purple-600", className)} />;
    }
    
    if (categoryLower.includes("tablet") || categoryLower.includes("planšetė") || 
        categoryLower.includes("ipad")) {
      return <Tablet size={size} className={cn("text-amber-600", className)} />;
    }
    
    if (categoryLower.includes("accessory") || categoryLower.includes("accessories") || 
        categoryLower.includes("priedai")) {
      return <Package size={size} className={cn("text-indigo-600", className)} />;
    }
    
    // Default icon for unknown categories
    return <Archive size={size} className={cn("text-gray-500", className)} />;
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <span>{category}</span>
    </div>
  );
};
