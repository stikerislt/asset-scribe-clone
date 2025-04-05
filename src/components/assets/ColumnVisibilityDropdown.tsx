
import React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export interface ColumnDef {
  id: string;
  label: string;
  isVisible: boolean;
}

export interface ColumnVisibilityDropdownProps {
  columns: ColumnDef[];
  onColumnVisibilityChange: (columnId: string, isVisible: boolean) => void;
  onResetColumns: () => void;
}

export function ColumnVisibilityDropdown({
  columns,
  onColumnVisibilityChange,
  onResetColumns,
}: ColumnVisibilityDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Settings className="w-4 h-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.isVisible}
            onCheckedChange={(checked) =>
              onColumnVisibilityChange(column.id, !!checked)
            }
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem onClick={onResetColumns}>
          Reset Columns
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
