
import React from "react";
import { Archive, Package, Computer, Menu, Copyright, Monitor, Printer, Phone, Globe, Tablet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: string;
  className?: string;
  size?: number;
  iconType?: string;
}

export const CategoryIcon = ({ category, className, size = 18, iconType }: CategoryIconProps) => {
  const categoryLower = category?.toLowerCase() || "";
  
  const getIcon = () => {
    // First priority: use the explicitly set iconType if available
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
        case "phone":
        case "smartphone":
          return <Smartphone size={size} className={cn("text-green-600", className)} />;
        case "globe":
          return <Globe size={size} className={cn("text-purple-600", className)} />;
        case "tablet":
          return <Tablet size={size} className={cn("text-indigo-600", className)} />;
      }
    }
    
    // Second priority: try to determine from category name
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
    
    if (categoryLower.includes("phone") || categoryLower.includes("mobile")) {
      return <Smartphone size={size} className={cn("text-green-600", className)} />;
    }
    
    if (categoryLower.includes("www") || categoryLower.includes("web") || 
        categoryLower.includes("website")) {
      return <Globe size={size} className={cn("text-purple-600", className)} />;
    }
    
    if (categoryLower.includes("tablet")) {
      return <Tablet size={size} className={cn("text-indigo-600", className)} />;
    }
    
    // Default fallback
    return <Archive size={size} className={cn("text-gray-500", className)} />;
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <span>{category}</span>
    </div>
  );
};
