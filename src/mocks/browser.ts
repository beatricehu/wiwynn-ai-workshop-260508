import { setupWorker } from "msw/browser";
import { authHandlers } from "@/mocks/handlers/auth";
import { vehicleHandlers } from "@/mocks/handlers/vehicles";
import { employeeHandlers } from "@/mocks/handlers/employees";
import { dashboardHandlers } from "@/mocks/handlers/dashboard";
import { historyHandlers } from "@/mocks/handlers/history";

export const handlers = [
  ...authHandlers,
  ...vehicleHandlers,
  ...employeeHandlers,
  ...dashboardHandlers,
  ...historyHandlers,
];

export const worker = setupWorker(...handlers);
