
import { Routes, Route } from "react-router-dom";
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

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route element={<AppLayout>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/assets/:id" element={<ProtectedRoute><AssetDetails /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        </Routes>
      </AppLayout>}>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
