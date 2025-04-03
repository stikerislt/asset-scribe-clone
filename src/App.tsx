
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ActivityProvider } from "@/hooks/useActivity";

// Pages
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetDetails from "./pages/AssetDetails";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ActivityProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              } 
            />
            <Route 
              path="/assets" 
              element={
                <AppLayout>
                  <Assets />
                </AppLayout>
              } 
            />
            <Route 
              path="/assets/:id" 
              element={
                <AppLayout>
                  <AssetDetails />
                </AppLayout>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <AppLayout>
                  <Categories />
                </AppLayout>
              } 
            />
            <Route 
              path="/users" 
              element={
                <AppLayout>
                  <Users />
                </AppLayout>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ActivityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
