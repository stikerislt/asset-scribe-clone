
import { Building, ChevronDown } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function TenantSelector() {
  const { currentTenant, userTenants, isLoading, switchTenant } = useTenant();

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />;
  }

  if (!currentTenant || userTenants.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-start">
          <Building className="mr-2 h-4 w-4" />
          {currentTenant.name}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userTenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className={`cursor-pointer ${tenant.id === currentTenant.id ? 'bg-accent' : ''}`}
          >
            <Building className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>{tenant.name}</span>
              {tenant.description && (
                <span className="text-xs text-muted-foreground">{tenant.description}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
