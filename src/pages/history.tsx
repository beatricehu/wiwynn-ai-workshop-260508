import { useCallback, useEffect, useMemo, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  AuditAction,
  AuditEvent,
  AuditResource,
  UserRole,
} from "@/lib/schemas";

type ResourceFilter = AuditResource | "all";
type ActionFilter = AuditAction | "all";

const RESOURCE_LABEL: Record<AuditResource, string> = {
  vehicle: "車輛",
  employee: "員工",
};

const ACTION_LABEL: Record<AuditAction, string> = {
  create: "新增",
  update: "更新",
  delete: "刪除",
};

const ACTION_BADGE: Record<AuditAction, string> = {
  create:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  update:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  delete:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const ROLE_BADGE: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  user: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("zh-TW", { hour12: false });
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "（空）";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("all");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<AuditEvent[]>("/api/history");
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法載入歷史紀錄");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!events) return null;
    return events.filter((evt) => {
      if (resourceFilter !== "all" && evt.resource !== resourceFilter)
        return false;
      if (actionFilter !== "all" && evt.action !== actionFilter) return false;
      return true;
    });
  }, [events, resourceFilter, actionFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" />
            修改歷史
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "admin"
              ? "顯示所有資源的修改紀錄"
              : "顯示所有車輛事件，以及與您相關的員工事件"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={resourceFilter}
            onValueChange={(v) => setResourceFilter(v as ResourceFilter)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部資源</SelectItem>
              <SelectItem value="vehicle">車輛</SelectItem>
              <SelectItem value="employee">員工</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={actionFilter}
            onValueChange={(v) => setActionFilter(v as ActionFilter)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部動作</SelectItem>
              <SelectItem value="create">新增</SelectItem>
              <SelectItem value="update">更新</SelectItem>
              <SelectItem value="delete">刪除</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">時間</TableHead>
              <TableHead className="w-40">操作者</TableHead>
              <TableHead className="w-20">動作</TableHead>
              <TableHead className="w-28">資源</TableHead>
              <TableHead>對象</TableHead>
              <TableHead>變更</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && events === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-destructive mb-3">無法載入：{error}</p>
                  <Button variant="outline" onClick={load}>
                    重試
                  </Button>
                </TableCell>
              </TableRow>
            ) : !filtered || filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {events && events.length === 0
                      ? "尚無修改紀錄。試著新增/編輯/刪除一筆資料看看。"
                      : "目前篩選條件下無紀錄"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatTime(evt.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{evt.actor.username}</span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_BADGE[evt.actor.role]}`}
                      >
                        {evt.actor.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[evt.action]}`}
                    >
                      {ACTION_LABEL[evt.action]}
                    </span>
                  </TableCell>
                  <TableCell>{RESOURCE_LABEL[evt.resource]}</TableCell>
                  <TableCell className="font-medium">
                    {evt.resourceLabel}
                  </TableCell>
                  <TableCell className="text-sm">
                    {evt.action === "update" && evt.changes ? (
                      <div className="space-y-0.5">
                        {evt.changes.map((c, i) => (
                          <div key={i} className="text-muted-foreground">
                            <span className="font-mono text-xs">{c.field}</span>{" "}
                            <span className="line-through opacity-70">
                              {formatValue(c.from)}
                            </span>{" "}
                            <span aria-hidden>→</span>{" "}
                            <span className="text-foreground">
                              {formatValue(c.to)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
