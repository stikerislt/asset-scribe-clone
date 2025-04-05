
import { AlertCircle } from "lucide-react";

interface DebugInfoProps {
  debugInfo: {
    authenticated: boolean;
    data?: any[];
    error?: {
      message: string;
    };
  } | null;
}

export const DebugInfo = ({ debugInfo }: DebugInfoProps) => {
  if (!debugInfo) return null;
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
      <h3 className="font-medium text-amber-900 mb-2">Debug Information</h3>
      <div className="text-sm text-amber-800">
        <p>Authentication status: {debugInfo.authenticated ? 'Authenticated' : 'Not authenticated'}</p>
        <p>Data received: {debugInfo.data ? debugInfo.data.length : 0} assets</p>
        {debugInfo.error && (
          <p className="text-red-600">Error: {debugInfo.error.message}</p>
        )}
      </div>
    </div>
  );
};

export const ErrorState = ({ 
  error, 
  onRetry, 
  onDebug 
}: { 
  error: Error; 
  onRetry: () => void; 
  onDebug: () => void; 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh]">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h1 className="text-xl font-bold mb-2">Error Loading Assets</h1>
      <p className="text-muted-foreground mb-4">{error?.message || 'Failed to load assets from the database.'}</p>
      <div className="flex gap-2">
        <Button onClick={onRetry}>
          Try Again
        </Button>
        <Button variant="outline" onClick={onDebug}>
          Debug Access
        </Button>
      </div>
    </div>
  );
};

// Have to re-import here because this file is not aware of the outer scope
import { Button } from "@/components/ui/button";
