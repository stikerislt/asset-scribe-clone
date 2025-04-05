
import React from 'react';
import { cn } from "@/lib/utils";
import { StatusColor } from "@/lib/data";

interface StatusColorIndicatorProps {
  color: StatusColor | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusColorIndicator({ 
  color = "green",
  size = "md", 
  className 
}: StatusColorIndicatorProps) {
  const getColorStyles = () => {
    switch (color) {
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "w-2 h-2";
      case "md":
        return "w-3 h-3";
      case "lg":
        return "w-4 h-4";
      default:
        return "w-3 h-3";
    }
  };

  return (
    <div 
      className={cn(
        "rounded-full", 
        getColorStyles(),
        getSizeStyles(),
        className
      )}
      title={`Status: ${color || 'Not set'}`}
    />
  );
}
