
import { Routes, Route } from "react-router-dom";
import { publicRoutes, protectedRoutes, catchAllRoute } from "@/routes";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * Main routing component that handles all application routes
 * including protected routes requiring authentication
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      {publicRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={route.element}
        />
      ))}
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
          >
            {route.children?.map((childRoute) => (
              <Route
                key={childRoute.path}
                path={childRoute.path}
                element={childRoute.element}
              />
            ))}
          </Route>
        ))}
      </Route>
      
      {/* Catch-all route (404) */}
      <Route
        path={catchAllRoute.path}
        element={catchAllRoute.element}
      />
    </Routes>
  );
}
