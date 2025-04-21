
import React from "react";
import { Archive, Package, Computer, Menu, Copyright, Monitor, Printer } from "lucide-react";
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
        case "menu":
          return <Menu size={size} className={cn("text-blue-600", className)} />;
        case "copyright":
          return <Copyright size={size} className={cn("text-violet-600", className)} />;
        case "monitor":
          return <Monitor size={size} className={cn("text-cyan-600", className)} />;
        case "printer":
          return <Printer size={size} className={cn("text-rose-600", className)} />;
        case "package":
          return <Package size={size} className={cn("text-indigo-600", className)} />;
        case "computer":
          return <Computer size={size} className={cn("text-cyan-600", className)} />;
        case "archive":
          return <Archive size={size} className={cn("text-blue-600", className)} />;
      }
    }
    
    // Check category names for icon mapping
    if (categoryLower.includes("inventory")) {
      return <Menu size={size} className={cn("text-blue-600", className)} />;
    }
    
    if (categoryLower.includes("license")) {
      return <Copyright size={size} className={cn("text-violet-600", className)} />;
    }
    
    if (categoryLower.includes("monitor")) {
      return <Monitor size={size} className={cn("text-cyan-600", className)} />;
    }
    
    if (categoryLower.includes("printer")) {
      return <Printer size={size} className={cn("text-rose-600", className)} />;
    }
    
    if (categoryLower.includes("accessories")) {
      return <Package size={size} className={cn("text-indigo-600", className)} />;
    }
    
    if (categoryLower.includes("computer") || categoryLower.includes("pc") || 
        categoryLower.includes("laptop")) {
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
