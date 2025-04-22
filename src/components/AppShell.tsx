
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { TenantProvider } from '@/hooks/useTenant';
import { TenantSelector } from './TenantSelector';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TenantProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b">
            <div className="flex h-16 items-center px-4 gap-4">
              <TenantSelector />
              <div className="ml-auto">
                <AppHeader />
              </div>
            </div>
          </div>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}
