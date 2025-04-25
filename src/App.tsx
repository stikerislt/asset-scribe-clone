
import { Toaster } from "@/components/ui/toaster";
import { SonnerToaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { ActivityProvider } from "@/hooks/useActivity";
import { AppRoutes } from "@/components/AppRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {/* AuthProvider needs to be before TenantProvider to ensure user is available */}
      <AuthProvider>
        <TenantProvider>
          <ActivityProvider>
            <Toaster />
            <SonnerToaster />
            <AppRoutes />
          </ActivityProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
