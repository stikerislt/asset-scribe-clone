
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

/**
 * Public routes accessible to all users
 */
export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Index />
  },
  {
    path: "/auth",
    element: <Auth />
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
        element: <EditAsset />
      },
      {
        path: "employees",
        element: <Employees />
      },
      {
        path: "employees/:id",
        element: <EmployeeDetails />
      },
      {
        path: "categories",
        element: <Categories />
      },
      {
        path: "analytics",
        element: <Analytics />
      },
      {
        path: "users",
        element: <Users />
      },
      {
        path: "settings",
        element: <Settings />
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

