import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, ArrowUpRight, ArrowDownRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WarehouseItemDetail {
  name: string;
  tag: string;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

interface WarehouseTransaction {
  id: string;
  warehouse_item_id: string;
  transaction_type: "add" | "remove";
  quantity: number;
  reason: string | null;
  notes: string | null;
  user_id: string | null;
  tenant_id: string | null;
  created_at: string;
  profiles?: Profile | null;
  warehouse_items?: WarehouseItemDetail | null;
}

interface WarehouseTransactionHistoryProps {
  itemId?: string;
  limit?: number;
  showViewAll?: boolean;
  showItemDetails?: boolean;
}

export function WarehouseTransactionHistory({
  itemId,
  limit = 5,
  showViewAll = true,
  showItemDetails = false,
}: WarehouseTransactionHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const effectiveLimit = showAll ? 100 : limit;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: [
      "warehouse-transactions",
      itemId,
      effectiveLimit,
      showItemDetails,
    ],
    queryFn: async () => {
      // Build the query
      let query = supabase
        .from("warehouse_transactions")
        .select(`
          *,
          profiles(
            full_name,
            email
          )
          ${showItemDetails ? `,warehouse_items(name, tag)` : ""}
        `)
        .order("created_at", { ascending: false })
        .limit(effectiveLimit);

      // If an item ID is specified, filter by it
      if (itemId) {
        query = query.eq("warehouse_item_id", itemId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as unknown as WarehouseTransaction[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            <p>No transactions recorded</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {showItemDetails && <TableHead>Item</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(
                          new Date(transaction.created_at),
                          "MMM d, yyyy h:mm a"
                        )}
                      </TableCell>
                      {showItemDetails && (
                        <TableCell>
                          {transaction.warehouse_items?.name} (
                          {transaction.warehouse_items?.tag})
                        </TableCell>
                      )}
                      <TableCell>
                        {transaction.transaction_type === "remove" ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800 border-red-200"
                          >
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                            Remove
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                            Add
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            {transaction.profiles?.full_name ||
                              transaction.profiles?.email ||
                              "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.reason || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {showViewAll && transactions.length >= limit && !showAll && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(true)}
                >
                  View All Transactions
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
