
import React from 'react';
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { WarehouseItem } from "@/components/warehouse/WarehouseItemTransactionDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface WarehouseItemsTableProps {
  items: WarehouseItem[];
  isLoading: boolean;
  onAddTransaction: (item: WarehouseItem) => void;
  onRemoveTransaction: (item: WarehouseItem) => void;
  onEditItem: (item: WarehouseItem) => void;
}

export function WarehouseItemsTable({
  items,
  isLoading,
  onAddTransaction,
  onRemoveTransaction,
  onEditItem,
}: WarehouseItemsTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-muted-foreground">Loading warehouse items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No warehouse items found. Add your first warehouse item to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.tag}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Badge variant={item.status === 'available' ? 'outline' : 'secondary'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className={item.quantity <= (item.reorder_level || 5) ? "text-red-600 font-bold" : ""}>
                  {item.quantity}
                </TableCell>
                <TableCell>{item.reorder_level || 5}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAddTransaction(item)}
                    >
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onRemoveTransaction(item)}
                      disabled={item.quantity <= 0}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditItem(item)}
                    >
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
