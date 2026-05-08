import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import { ApiException, api } from "@/lib/api";
import type { Vehicle, VehicleStatus } from "@/lib/schemas";

const STATUS_LABEL: Record<VehicleStatus, string> = {
  available: "可用",
  "in-use": "使用中",
  maintenance: "維修中",
};

const STATUS_BADGE: Record<VehicleStatus, string> = {
  available:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "in-use":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  maintenance:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Vehicle[]>("/api/vehicles");
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法載入車輛資料");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = () => {
    setDialogMode("create");
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (v: Vehicle) => {
    setDialogMode("edit");
    setEditing(v);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.del(`/api/vehicles/${deletingId}`);
      toast.success("刪除成功");
      setDeletingId(null);
      load();
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.message : "刪除失敗，請稍後再試";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">車輛管理</h1>
          <p className="text-sm text-muted-foreground">
            檢視、新增、編輯與刪除車輛資料
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增車輛
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>車牌</TableHead>
              <TableHead>品牌</TableHead>
              <TableHead>車型</TableHead>
              <TableHead className="w-20">年份</TableHead>
              <TableHead className="w-24">狀態</TableHead>
              <TableHead>使用者</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && vehicles === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-destructive mb-3">無法載入：{error}</p>
                  <Button variant="outline" onClick={load}>
                    重試
                  </Button>
                </TableCell>
              </TableRow>
            ) : vehicles && vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center space-y-3">
                  <p className="text-muted-foreground">尚無車輛資料</p>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增車輛
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              vehicles?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.plateNo}</TableCell>
                  <TableCell>{v.brand}</TableCell>
                  <TableCell>{v.model}</TableCell>
                  <TableCell>{v.year}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[v.status]}`}
                    >
                      {STATUS_LABEL[v.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.assignedTo || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(v)}
                      aria-label="編輯"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingId(v.id)}
                      aria-label="刪除"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VehicleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editing}
        onSuccess={load}
      />

      <AlertDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原，確定要刪除這筆車輛資料？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
