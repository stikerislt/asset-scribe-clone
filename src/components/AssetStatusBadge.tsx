
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AssetStatus } from "@/lib/data";

interface AssetStatusBadgeProps {
  status: AssetStatus;
}

export function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const getStatusStyles = (status: AssetStatus) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "assigned":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case "pending":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100/80";
      case "archived":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
      case "broken":
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: AssetStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Badge className={cn("font-normal", getStatusStyles(status))} variant="outline">
      {getStatusLabel(status)}
    </Badge>
  );
}
