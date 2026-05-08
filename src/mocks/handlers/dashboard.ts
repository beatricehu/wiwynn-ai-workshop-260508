import { http, HttpResponse } from "msw";
import type { VehicleStatus } from "@/lib/schemas";
import { employees, vehicles } from "@/mocks/db";
import { requireAuth } from "@/mocks/lib/auth";

const STATUSES: VehicleStatus[] = ["available", "in-use", "maintenance"];

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildMonthlyAdded(): Array<{ month: string; count: number }> {
  const now = new Date();
  const buckets: Array<{ month: string; count: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: monthKey(d), count: 0 });
  }
  const keyToIdx = new Map(buckets.map((b, idx) => [b.month, idx]));
  for (const v of vehicles) {
    const key = monthKey(new Date(v.createdAt));
    const idx = keyToIdx.get(key);
    if (idx !== undefined) buckets[idx].count += 1;
  }
  return buckets;
}

export const dashboardHandlers = [
  http.get("/api/dashboard/stats", ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const thisMonth = monthKey(new Date());
    const addedThisMonth = vehicles.filter(
      (v) => monthKey(new Date(v.createdAt)) === thisMonth,
    ).length;

    const statusDistribution = STATUSES.map((status) => ({
      status,
      count: vehicles.filter((v) => v.status === status).length,
    }));

    return HttpResponse.json({
      totals: {
        vehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.status === "available")
          .length,
        employees: employees.length,
        addedThisMonth,
      },
      statusDistribution,
      monthlyAdded: buildMonthlyAdded(),
    });
  }),
];
