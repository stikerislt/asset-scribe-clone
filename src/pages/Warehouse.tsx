
import React, { useState } from 'react';
import { Package, LogOut, LogIn, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset } from "@/lib/api/assets";
import { useTenant } from "@/hooks/useTenant";
import { AssetTransactionDialog } from "@/components/assets/AssetTransactionDialog";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";

interface Transaction {
  id: string;
  asset_id: string;
  user_id: string;
  transaction_type: "check_out" | "check_in";
  quantity: number;
  purpose: string | null;
  expected_return_date: string | null;
  created_at: string;
  notes: string | null;
  asset: {
    id: string;
    name: string;
    tag: string;
    status: string;
  } | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const Warehouse = () => {
  const { currentTenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionAsset, setTransactionAsset] = useState<Asset | null>(null);
  const [transactionType, setTransactionType] = useState<"check_out" | "check_in">("check_out");

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

  // Fetch recent transactions
  const { data: recentTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['recent-transactions', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      
      const { data, error } = await supabase
        .from('asset_transactions')
        .select(`
          *,
          asset:asset_id (
            id,
            name,
            tag,
            status
          ),
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return data as Transaction[];
    },
    enabled: !!currentTenant?.id,
  });

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openTransactionDialog = (asset: Asset, type: "check_out" | "check_in") => {
    setTransactionAsset(asset);
    setTransactionType(type);
  };

  const closeTransactionDialog = () => {
    setTransactionAsset(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground mt-1">
            Check out and return assets from your inventory
          </p>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>
        
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
          ) : filteredAssets.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">No assets match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.tag}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell><AssetStatusBadge status={asset.status} /></TableCell>
                        <TableCell>{asset.qty || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openTransactionDialog(asset, "check_out")}
                              disabled={!asset.qty || asset.qty <= 0}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              Check Out
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openTransactionDialog(asset, "check_in")}
                            >
                              <LogIn className="h-4 w-4 mr-1" />
                              Check In
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                History of recent asset check-outs and check-ins
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTransactions ? (
                <div className="text-center py-10">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No transactions recorded yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Purpose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell>
                          {transaction.asset ? (
                            <span className="font-medium">{transaction.asset.name} ({transaction.asset.tag})</span>
                          ) : (
                            <span className="text-muted-foreground">Unknown asset</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.transaction_type === "check_out" ? (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              <ArrowUpRight className="mr-1 h-3 w-3" />
                              Out
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              <ArrowDownRight className="mr-1 h-3 w-3" />
                              In
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>
                          {transaction.profiles?.full_name || transaction.profiles?.email || "Unknown user"}
                        </TableCell>
                        <TableCell>
                          {transaction.purpose || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {transactionAsset && (
        <AssetTransactionDialog
          asset={transactionAsset}
          isOpen={!!transactionAsset}
          onClose={closeTransactionDialog}
          transactionType={transactionType}
        />
      )}
    </div>
  );
};

export default Warehouse;
