
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import Employees from "@/pages/Employees";
import AssetDetails from "@/pages/AssetDetails";
import Categories from "@/pages/Categories";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "@/pages/Index";
import EmployeeDetails from "@/pages/EmployeeDetails";
import Analytics from "@/pages/Analytics";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/login" element={<Auth />} />
      <Route path="/auth/signup" element={<Auth />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/assets" element={
        <ProtectedRoute>
          <AppLayout>
            <Assets />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/assets/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <AssetDetails />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute>
          <AppLayout>
            <Employees />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/employees/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <EmployeeDetails />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute>
          <AppLayout>
            <Categories />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AppLayout>
            <Analytics />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <AppLayout>
            <Users />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
