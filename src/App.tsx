
import { Toaster } from "@/components/ui/toaster";
import { SonnerToaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ActivityProvider } from "@/hooks/useActivity";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { AppRoutes } from "@/components/AppRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <ActivityProvider>
            <Toaster />
            <SonnerToaster />
            <AppRoutes />
          </ActivityProvider>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
