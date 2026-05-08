import { http, HttpResponse } from "msw";
import { employeeInputSchema, type Employee } from "@/lib/schemas";
import { diff, recordEvent } from "@/mocks/audit-log";
import { employees, generateId } from "@/mocks/db";
import { requireAuth } from "@/mocks/lib/auth";
import { errorResponse } from "@/mocks/lib/response";

function findIndex(id: string): number {
  return employees.findIndex((e) => e.id === id);
}

function emailExists(email: string, excludeId?: string): boolean {
  const lower = email.toLowerCase();
  return employees.some(
    (e) => e.email.toLowerCase() === lower && e.id !== excludeId,
  );
}

export const employeeHandlers = [
  http.get("/api/employees", ({ request }) => {
    const auth = requireAuth(request, "admin");
    if (auth instanceof Response) return auth;
    const sorted = [...employees].sort(
      (a, b) =>
        new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime(),
    );
    return HttpResponse.json(sorted);
  }),

  http.post("/api/employees", async ({ request }) => {
    const auth = requireAuth(request, "admin");
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => null);
    const parsed = employeeInputSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorResponse(400, issue.message, String(issue.path[0] ?? ""));
    }
    if (emailExists(parsed.data.email)) {
      return errorResponse(409, "Email 已存在", "email");
    }
    const newEmployee: Employee = {
      ...parsed.data,
      id: generateId("e"),
    };
    employees.push(newEmployee);
    recordEvent({
      resource: "employee",
      resourceId: newEmployee.id,
      resourceLabel: newEmployee.name,
      action: "create",
      actor: { userId: auth.userId, username: auth.username, role: auth.role },
    });
    return HttpResponse.json(newEmployee, { status: 201 });
  }),

  http.get("/api/employees/:id", ({ request, params }) => {
    const auth = requireAuth(request, "admin");
    if (auth instanceof Response) return auth;
    const id = String(params.id);
    const e = employees.find((x) => x.id === id);
    if (!e) return errorResponse(404, "員工不存在");
    return HttpResponse.json(e);
  }),

  http.put("/api/employees/:id", async ({ request, params }) => {
    const auth = requireAuth(request, "admin");
    if (auth instanceof Response) return auth;

    const id = String(params.id);
    const idx = findIndex(id);
    if (idx === -1) return errorResponse(404, "員工不存在");

    const body = await request.json().catch(() => null);
    const parsed = employeeInputSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorResponse(400, issue.message, String(issue.path[0] ?? ""));
    }
    if (emailExists(parsed.data.email, id)) {
      return errorResponse(409, "Email 已存在", "email");
    }
    const prev = employees[idx];
    const updated: Employee = { ...prev, ...parsed.data };
    employees[idx] = updated;
    const changes = diff(prev as unknown as Record<string, unknown>, parsed.data);
    if (changes.length > 0) {
      recordEvent({
        resource: "employee",
        resourceId: updated.id,
        resourceLabel: updated.name,
        action: "update",
        actor: { userId: auth.userId, username: auth.username, role: auth.role },
        changes,
      });
    }
    return HttpResponse.json(updated);
  }),

  http.delete("/api/employees/:id", ({ request, params }) => {
    const auth = requireAuth(request, "admin");
    if (auth instanceof Response) return auth;
    const id = String(params.id);
    const idx = findIndex(id);
    if (idx === -1) return errorResponse(404, "員工不存在");
    const removed = employees[idx];
    employees.splice(idx, 1);
    recordEvent({
      resource: "employee",
      resourceId: removed.id,
      resourceLabel: removed.name,
      action: "delete",
      actor: { userId: auth.userId, username: auth.username, role: auth.role },
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
