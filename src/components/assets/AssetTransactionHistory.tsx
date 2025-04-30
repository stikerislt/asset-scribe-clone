
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, ArrowUpRight, ArrowDownRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Asset } from "@/lib/api/assets";

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
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface AssetTransactionHistoryProps {
  asset: Asset;
  limit?: number;
  showViewAll?: boolean;
}

export function AssetTransactionHistory({
  asset,
  limit = 5,
  showViewAll = true,
}: AssetTransactionHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const effectiveLimit = showAll ? 100 : limit;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["asset-transactions", asset.id, effectiveLimit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_transactions")
        .select(`
          *,
          profiles:profiles(
            full_name,
            email
          )
        `)
        .eq("asset_id", asset.id)
        .order("created_at", { ascending: false })
        .limit(effectiveLimit);

      if (error) throw error;
      
      return data as Transaction[];
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
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Return Date</TableHead>
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
                        {transaction.purpose || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.expected_return_date
                          ? format(
                              new Date(transaction.expected_return_date),
                              "MMM d, yyyy"
                            )
                          : null}
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
