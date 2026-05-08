import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { AdminRoute, ProtectedRoute } from "@/components/route-guard";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import VehiclesPage from "@/pages/vehicles";
import EmployeesPage from "@/pages/employees";
import HistoryPage from "@/pages/history";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "vehicles", element: <VehiclesPage /> },
      {
        path: "employees",
        element: (
          <AdminRoute>
            <EmployeesPage />
          </AdminRoute>
        ),
      },
      { path: "history", element: <HistoryPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
