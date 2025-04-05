
import React from "react";
import { CheckSquare, EyeOff, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface ColumnDef {
  id: string;
  label: string;
  isVisible: boolean;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnDef[];
  onColumnVisibilityChange: (columnId: string, isVisible: boolean) => void;
  onResetColumns: () => void;
}

export const ColumnVisibilityDropdown: React.FC<ColumnVisibilityDropdownProps> = ({
  columns,
  onColumnVisibilityChange,
  onResetColumns
}) => {
  const visibleCount = columns.filter(col => col.isVisible).length;
  const hasHiddenColumns = visibleCount < columns.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1"
        >
          {hasHiddenColumns ? <EyeOff className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          <span className="hidden sm:inline">Columns</span>
          {hasHiddenColumns && (
            <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5">
              {visibleCount}/{columns.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.isVisible}
            onCheckedChange={(checked) => onColumnVisibilityChange(column.id, checked)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onResetColumns}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Show All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
