import { http, HttpResponse } from "msw";
import { vehicleInputSchema, type Vehicle } from "@/lib/schemas";
import { diff, recordEvent } from "@/mocks/audit-log";
import { generateId, vehicles } from "@/mocks/db";
import { requireAuth } from "@/mocks/lib/auth";
import { errorResponse } from "@/mocks/lib/response";

function findIndex(id: string): number {
  return vehicles.findIndex((v) => v.id === id);
}

function plateExists(plateNo: string, excludeId?: string): boolean {
  return vehicles.some(
    (v) => v.plateNo === plateNo && v.id !== excludeId,
  );
}

export const vehicleHandlers = [
  http.get("/api/vehicles", ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const sorted = [...vehicles].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return HttpResponse.json(sorted);
  }),

  http.post("/api/vehicles", async ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => null);
    const parsed = vehicleInputSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorResponse(400, issue.message, String(issue.path[0] ?? ""));
    }
    if (plateExists(parsed.data.plateNo)) {
      return errorResponse(409, "車牌已存在", "plateNo");
    }
    const newVehicle: Vehicle = {
      ...parsed.data,
      id: generateId("v"),
      createdAt: new Date().toISOString(),
    };
    vehicles.push(newVehicle);
    recordEvent({
      resource: "vehicle",
      resourceId: newVehicle.id,
      resourceLabel: newVehicle.plateNo,
      action: "create",
      actor: { userId: auth.userId, username: auth.username, role: auth.role },
    });
    return HttpResponse.json(newVehicle, { status: 201 });
  }),

  http.get("/api/vehicles/:id", ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const id = String(params.id);
    const v = vehicles.find((x) => x.id === id);
    if (!v) return errorResponse(404, "車輛不存在");
    return HttpResponse.json(v);
  }),

  http.put("/api/vehicles/:id", async ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const id = String(params.id);
    const idx = findIndex(id);
    if (idx === -1) return errorResponse(404, "車輛不存在");

    const body = await request.json().catch(() => null);
    const parsed = vehicleInputSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorResponse(400, issue.message, String(issue.path[0] ?? ""));
    }
    if (plateExists(parsed.data.plateNo, id)) {
      return errorResponse(409, "車牌已存在", "plateNo");
    }
    const prev = vehicles[idx];
    const updated: Vehicle = { ...prev, ...parsed.data };
    vehicles[idx] = updated;
    const changes = diff(prev as unknown as Record<string, unknown>, parsed.data);
    if (changes.length > 0) {
      recordEvent({
        resource: "vehicle",
        resourceId: updated.id,
        resourceLabel: updated.plateNo,
        action: "update",
        actor: { userId: auth.userId, username: auth.username, role: auth.role },
        changes,
      });
    }
    return HttpResponse.json(updated);
  }),

  http.delete("/api/vehicles/:id", ({ request, params }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const id = String(params.id);
    const idx = findIndex(id);
    if (idx === -1) return errorResponse(404, "車輛不存在");
    const removed = vehicles[idx];
    vehicles.splice(idx, 1);
    recordEvent({
      resource: "vehicle",
      resourceId: removed.id,
      resourceLabel: removed.plateNo,
      action: "delete",
      actor: { userId: auth.userId, username: auth.username, role: auth.role },
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
