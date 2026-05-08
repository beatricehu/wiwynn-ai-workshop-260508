import { http, HttpResponse } from "msw";
import { auditLog } from "@/mocks/audit-log";
import { users } from "@/mocks/db";
import { requireAuth } from "@/mocks/lib/auth";

/**
 * 權限規則：
 *  - admin：看全部事件（vehicle + employee）
 *  - user ：看全部 vehicle 事件 + 與「自己關聯員工」相關的 employee 事件
 *           （employee 事件以 resourceId === user.employeeId 過濾）
 */
export const historyHandlers = [
  http.get("/api/history", ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    let visible = auditLog;
    if (auth.role !== "admin") {
      const me = users.find((u) => u.id === auth.userId);
      const myEmployeeId = me?.employeeId;
      visible = auditLog.filter((evt) => {
        if (evt.resource === "vehicle") return true;
        if (evt.resource === "employee") {
          return Boolean(myEmployeeId) && evt.resourceId === myEmployeeId;
        }
        return false;
      });
    }

    const sorted = [...visible].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return HttpResponse.json(sorted);
  }),
];
