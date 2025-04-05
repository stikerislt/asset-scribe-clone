
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from "recharts";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { StatusColor } from "@/lib/data";
import { StatusColorIndicator } from "@/components/StatusColorIndicator";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Loader } from "lucide-react";

interface AssetStatusCount {
  status_color: StatusColor | null;
  count: number;
}

const Analytics = () => {
  const { data: statusCounts = [], isLoading } = useQuery({
    queryKey: ['asset-status-colors'],
    queryFn: async () => {
      // Query to count assets by status_color using a more compatible approach
      const { data: assets, error } = await supabase
        .from('assets')
        .select('status_color');
      
      if (error) throw error;
      
      // Process the results manually to count by status_color
      const counts: Record<string, number> = {};
      assets.forEach(asset => {
        const color = asset.status_color || 'null';
        counts[color] = (counts[color] || 0) + 1;
      });
      
      // Format the results to match our expected structure
      const result: AssetStatusCount[] = Object.entries(counts).map(([key, count]) => ({
        status_color: key === 'null' ? null : key as StatusColor,
        count
      }));
      
      // Add missing colors with count 0
      const colors: (StatusColor | null)[] = ['green', 'yellow', 'red', null];
      
      colors.forEach(color => {
        if (!result.find(item => item.status_color === color)) {
          result.push({ status_color: color, count: 0 });
        }
      });
      
      return result;
    }
  });
  
  // Format data for chart
  const chartData = statusCounts.map(item => ({
    name: item.status_color || 'Not set',
    value: item.count,
    color: getColorForStatus(item.status_color)
  }));
  
  // Get color for chart segments
  function getColorForStatus(status: StatusColor | null): string {
    switch (status) {
      case 'green': return '#22c55e';  // Tailwind green-500
      case 'yellow': return '#eab308'; // Tailwind yellow-500
      case 'red': return '#ef4444';    // Tailwind red-500
      default: return '#94a3b8';       // Tailwind slate-400
    }
  }

  const chartConfig = {
    green: { color: '#22c55e', label: 'Good' },
    yellow: { color: '#eab308', label: 'Warning' },
    red: { color: '#ef4444', label: 'Critical' },
    null: { color: '#94a3b8', label: 'Not set' }
  };
  
  const totalAssets = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights and statistics about your assets</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Status Distribution</CardTitle>
            <CardDescription>Distribution of assets by status color</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader className="h-8 w-8 animate-spin mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            ) : totalAssets === 0 ? (
              <div className="text-center text-muted-foreground">
                <p>No asset data available</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value) => {
                      const item = chartData.find(d => d.name === value);
                      return (
                        <span className="flex items-center">
                          <StatusColorIndicator 
                            color={value === 'Not set' ? null : value as StatusColor} 
                            className="mr-2" 
                          />
                          {value} ({item ? item.value : 0})
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Asset Status Summary</CardTitle>
            <CardDescription>Count and percentage of assets by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center py-8">
                  <Loader className="h-8 w-8 animate-spin mb-2 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Loading data...</p>
                </div>
              ) : totalAssets === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No asset data available</p>
                </div>
              ) : (
                <>
                  <p className="text-lg font-medium">Total Assets: {totalAssets}</p>
                  <div className="space-y-3">
                    {chartData.map((item) => {
                      const percentage = totalAssets > 0 
                        ? ((item.value / totalAssets) * 100).toFixed(1) 
                        : '0';
                      
                      return (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <StatusColorIndicator 
                              color={item.name === 'Not set' ? null : item.name as StatusColor} 
                              className="mr-2" 
                            />
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">{item.value}</span>
                            <span className="text-muted-foreground ml-2">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
