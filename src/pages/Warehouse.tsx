
import React, { useState } from 'react';
import { Package, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset } from "@/lib/api/assets";
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
import { AssetTransactionDialog } from "@/components/assets/AssetTransactionDialog";
import { AssetTable } from "@/components/assets/AssetTable";

const Warehouse = () => {
  const { currentTenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionAsset, setTransactionAsset] = useState<Asset | null>(null);
  const [transactionType, setTransactionType] = useState<"check_out" | "check_in">("check_out");
  
  // State for warehouse items
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<WarehouseItem | null>(null);
  const [warehouseItemTransactionType, setWarehouseItemTransactionType] = useState<"add" | "remove">("add");
  const [isWarehouseTransactionDialogOpen, setIsWarehouseTransactionDialogOpen] = useState(false);
  const [isAddWarehouseItemDialogOpen, setIsAddWarehouseItemDialogOpen] = useState(false);
  const [warehouseItemToEdit, setWarehouseItemToEdit] = useState<WarehouseItem | null>(null);

  // Fetch assets for the tenant
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['warehouse-assets', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;
      
      return data as Asset[];
    },
    enabled: !!currentTenant?.id,
  });

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

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWarehouseItems = warehouseItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openTransactionDialog = (asset: Asset) => {
    setTransactionAsset(asset);
  };

  const closeTransactionDialog = () => {
    setTransactionAsset(null);
  };

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

  const handleDeleteAsset = () => {
    // This is just a placeholder to satisfy the AssetTable props
    // We're not implementing asset deletion in this view
  };

  const handleStatusColorChange = () => {
    // This is just a placeholder to satisfy the AssetTable props
    // We're not implementing status color changes in this view
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage warehouse inventory and asset check-outs
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
          <TabsTrigger value="inventory">Asset Inventory</TabsTrigger>
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
          
          <WarehouseTransactionHistory showItemDetails={true} />
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center mb-4">
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoadingAssets ? (
            <div className="text-center py-10">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading inventory...</p>
            </div>
          ) : (
            <AssetTable 
              assets={filteredAssets}
              columns={[
                { id: "tag", label: "Asset Tag", isVisible: true },
                { id: "name", label: "Name", isVisible: true },
                { id: "status", label: "Status", isVisible: true },
                { id: "quantity", label: "Qty", isVisible: true }
              ]}
              onDeleteAsset={handleDeleteAsset} 
              onStatusColorChange={handleStatusColorChange}
              onCheckOut={(asset) => {
                setTransactionAsset(asset);
                setTransactionType("check_out");
              }}
              onCheckIn={(asset) => {
                setTransactionAsset(asset);
                setTransactionType("check_in");
              }}
            />
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <WarehouseTransactionHistory showItemDetails={true} limit={20} />
        </TabsContent>
      </Tabs>

      {/* Asset Transaction Dialog */}
      {transactionAsset && (
        <AssetTransactionDialog
          asset={transactionAsset}
          isOpen={!!transactionAsset}
          onClose={closeTransactionDialog}
          transactionType={transactionType}
        />
      )}

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
