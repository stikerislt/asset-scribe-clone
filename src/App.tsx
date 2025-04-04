
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ActivityProvider } from "@/hooks/useActivity";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetDetails from "./pages/AssetDetails";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ActivityProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Auth Routes */}
            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/:action" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assets" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Assets />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assets/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AssetDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Categories />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ActivityProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
