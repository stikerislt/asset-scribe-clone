import { RouteObject } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import AssetDetails from "@/pages/AssetDetails";
import EditAsset from "@/pages/EditAsset";
import Employees from "@/pages/Employees";
import EmployeeDetails from "@/pages/EmployeeDetails";
import Categories from "@/pages/Categories";
import Analytics from "@/pages/Analytics";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import { AppLayout } from "@/components/AppLayout";
import UpdatePassword from "@/pages/UpdatePassword";
import Onboarding from "@/pages/Onboarding";

/**
 * Public routes accessible to all users
 */
export const publicRoutes = [
  {
    path: "/",
    element: <Index />
  },
  {
    path: "/auth/*",
    element: <Auth />
  },
  {
    path: "/auth/login",
    element: <Auth />
  },
  {
    path: "/auth/signup",
    element: <Auth />
  },
  {
    path: "/auth/forgot-password",
    element: <Auth />
  },
  {
    path: "/auth/update-password",
    element: <UpdatePassword />
  },
  {
    path: "/onboarding",
    element: <Onboarding />
  }
];

/**
 * Protected routes accessible only to authenticated users
 */
export const protectedRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />
      },
      {
        path: "assets",
        element: <Assets />
      },
      {
        path: "assets/:id",
        element: <AssetDetails />
      },
      {
        path: "assets/edit/:id",
        element: <ProtectedRoute requiredRole="manager"><EditAsset /></ProtectedRoute>
      },
      {
        path: "employees",
        element: <ProtectedRoute requiredRole="manager"><Employees /></ProtectedRoute>
      },
      {
        path: "employees/:id",
        element: <ProtectedRoute requiredRole="manager"><EmployeeDetails /></ProtectedRoute>
      },
      {
        path: "categories",
        element: <ProtectedRoute requiredRole="manager"><Categories /></ProtectedRoute>
      },
      {
        path: "analytics",
        element: <ProtectedRoute requiredRole="manager"><Analytics /></ProtectedRoute>
      },
      {
        path: "users",
        element: <ProtectedRoute requiredRole="manager"><Users /></ProtectedRoute>
      },
      {
        path: "settings",
        element: <ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>
      }
    ]
  }
];

/**
 * Catch-all route for 404 pages
 */
export const catchAllRoute: RouteObject = {
  path: "*",
  element: <NotFound />
};
