
import React, { useState } from 'react';
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { WarehouseItem, WarehouseItemTransactionDialog } from "@/components/warehouse/WarehouseItemTransactionDialog";
import { WarehouseItemDialog } from "@/components/warehouse/WarehouseItemDialog";
import { WarehouseTransactionHistory } from "@/components/warehouse/WarehouseTransactionHistory";
import { WarehouseItemsTable } from "@/components/warehouse/WarehouseItemsTable";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Warehouse = () => {
  const { currentTenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for warehouse items
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<WarehouseItem | null>(null);
  const [warehouseItemTransactionType, setWarehouseItemTransactionType] = useState<"add" | "remove">("add");
  const [isWarehouseTransactionDialogOpen, setIsWarehouseTransactionDialogOpen] = useState(false);
  const [isAddWarehouseItemDialogOpen, setIsAddWarehouseItemDialogOpen] = useState(false);
  const [warehouseItemToEdit, setWarehouseItemToEdit] = useState<WarehouseItem | null>(null);

  // Fetch warehouse items
  const { data: warehouseItems = [], isLoading: isLoadingWarehouseItems } = useQuery({
    queryKey: ['warehouse-items', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      
      const { data, error } = await supabase
        .from('warehouse_items')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;
      
      return data as WarehouseItem[];
    },
    enabled: !!currentTenant?.id,
  });

  const filteredWarehouseItems = warehouseItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddWarehouseItem = () => {
    setWarehouseItemToEdit(null);
    setIsAddWarehouseItemDialogOpen(true);
  };
  
  const handleEditWarehouseItem = (item: WarehouseItem) => {
    setWarehouseItemToEdit(item);
    setIsAddWarehouseItemDialogOpen(true);
  };
  
  const handleWarehouseItemAdd = (item: WarehouseItem) => {
    setSelectedWarehouseItem(item);
    setWarehouseItemTransactionType("add");
    setIsWarehouseTransactionDialogOpen(true);
  };
  
  const handleWarehouseItemRemove = (item: WarehouseItem) => {
    setSelectedWarehouseItem(item);
    setWarehouseItemTransactionType("remove");
    setIsWarehouseTransactionDialogOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage warehouse inventory
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button onClick={handleAddWarehouseItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Warehouse Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="warehouse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="warehouse">Warehouse Items</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>
        
        {/* Warehouse Items Tab */}
        <TabsContent value="warehouse" className="space-y-4">
          <div className="flex items-center mb-4">
            <Input
              placeholder="Search warehouse items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <WarehouseItemsTable 
            items={filteredWarehouseItems} 
            isLoading={isLoadingWarehouseItems}
            onAddTransaction={handleWarehouseItemAdd}
            onRemoveTransaction={handleWarehouseItemRemove}
            onEditItem={handleEditWarehouseItem}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <WarehouseTransactionHistory showItemDetails={true} limit={20} />
        </TabsContent>
      </Tabs>

      {/* Warehouse Item Transaction Dialog */}
      <WarehouseItemTransactionDialog
        item={selectedWarehouseItem}
        isOpen={isWarehouseTransactionDialogOpen}
        onClose={() => setIsWarehouseTransactionDialogOpen(false)}
        transactionType={warehouseItemTransactionType}
      />

      {/* Add/Edit Warehouse Item Dialog */}
      <WarehouseItemDialog
        isOpen={isAddWarehouseItemDialogOpen}
        onClose={() => setIsAddWarehouseItemDialogOpen(false)}
        defaultValues={warehouseItemToEdit || undefined}
        isEdit={!!warehouseItemToEdit}
        itemId={warehouseItemToEdit?.id}
      />
    </div>
  );
};

export default Warehouse;
