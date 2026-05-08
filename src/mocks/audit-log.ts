import type {
  AuditAction,
  AuditChange,
  AuditEvent,
  AuditResource,
  UserRole,
} from "@/lib/schemas";
import { generateId } from "@/mocks/db";

export const auditLog: AuditEvent[] = [];

type Actor = {
  userId: string;
  username: string;
  role: UserRole;
};

/**
 * 比對兩個物件的差異，回傳 changes 陣列。
 * 僅比較傳入的欄位（取 next 的 keys；忽略 prev 多出的內部欄位如 id/createdAt）。
 */
export function diff<T extends Record<string, unknown>>(
  prev: T,
  next: Partial<T>,
): AuditChange[] {
  const changes: AuditChange[] = [];
  for (const key of Object.keys(next) as Array<keyof T>) {
    const from = prev[key];
    const to = next[key];
    if (!shallowEqual(from, to)) {
      changes.push({ field: String(key), from, to });
    }
  }
  return changes;
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  return false;
}

export function recordEvent(input: {
  resource: AuditResource;
  resourceId: string;
  resourceLabel: string;
  action: AuditAction;
  actor: Actor;
  changes?: AuditChange[];
}): AuditEvent {
  const event: AuditEvent = {
    id: generateId("a"),
    resource: input.resource,
    resourceId: input.resourceId,
    resourceLabel: input.resourceLabel,
    action: input.action,
    actor: input.actor,
    changes: input.changes,
    createdAt: new Date().toISOString(),
  };
  auditLog.push(event);
  return event;
}
