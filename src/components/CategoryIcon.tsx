
import React from "react";
import { Archive, Smartphone, Globe, Tablet, Package, Computer } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: string;
  className?: string;
  size?: number;
  iconType?: string;
}

export const CategoryIcon = ({ category, className, size = 18, iconType }: CategoryIconProps) => {
  const categoryLower = category?.toLowerCase() || "";
  
  // Get icon based on iconType if provided, otherwise infer from category name
  const getIcon = () => {
    // If explicit icon type is provided, use that
    if (iconType) {
      switch (iconType) {
        case "archive":
          return <Archive size={size} className={cn("text-blue-600", className)} />;
        case "smartphone":
          return <Smartphone size={size} className={cn("text-green-600", className)} />;
        case "globe":
          return <Globe size={size} className={cn("text-purple-600", className)} />;
        case "tablet":
          return <Tablet size={size} className={cn("text-amber-600", className)} />;
        case "package":
          return <Package size={size} className={cn("text-indigo-600", className)} />;
        case "computer":
          return <Computer size={size} className={cn("text-cyan-600", className)} />;
      }
    }
    
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
    
    if (categoryLower.includes("computer") || categoryLower.includes("kompiuteris") || 
        categoryLower.includes("pc") || categoryLower.includes("laptop")) {
      return <Computer size={size} className={cn("text-cyan-600", className)} />;
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
