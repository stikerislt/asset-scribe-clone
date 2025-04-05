
import { Routes, Route, Outlet } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import AssetDetails from "@/pages/AssetDetails";
import Employees from "@/pages/Employees";
import EmployeeDetails from "@/pages/EmployeeDetails";
import Categories from "@/pages/Categories";
import Analytics from "@/pages/Analytics";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import EditAsset from "@/pages/EditAsset";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout children={<Outlet />} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/:id" element={<AssetDetails />} />
          <Route path="/assets/edit/:id" element={<EditAsset />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/:id" element={<EmployeeDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
