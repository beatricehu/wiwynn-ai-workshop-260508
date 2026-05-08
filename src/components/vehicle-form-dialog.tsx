import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiException, api } from "@/lib/api";
import {
  vehicleInputSchema,
  type Vehicle,
  type VehicleInput,
} from "@/lib/schemas";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: Vehicle | null;
  onSuccess: () => void;
};

const STATUS_OPTIONS: Array<{ value: VehicleInput["status"]; label: string }> = [
  { value: "available", label: "可用" },
  { value: "in-use", label: "使用中" },
  { value: "maintenance", label: "維修中" },
];

const EMPTY: VehicleInput = {
  plateNo: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  status: "available",
  assignedTo: "",
};

export function VehicleFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSuccess,
}: Props) {
  const form = useForm<VehicleInput>({
    resolver: zodResolver(vehicleInputSchema),
    defaultValues: EMPTY,
  });

  // 開啟時依模式重設表單
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      form.reset({
        plateNo: initial.plateNo,
        brand: initial.brand,
        model: initial.model,
        year: initial.year,
        status: initial.status,
        assignedTo: initial.assignedTo ?? "",
      });
    } else {
      form.reset(EMPTY);
    }
  }, [open, mode, initial, form]);

  const onSubmit = async (values: VehicleInput) => {
    try {
      const payload: VehicleInput = {
        ...values,
        assignedTo: values.assignedTo?.trim() || undefined,
      };
      if (mode === "create") {
        await api.post<Vehicle>("/api/vehicles", payload);
        toast.success("新增成功");
      } else if (initial) {
        await api.put<Vehicle>(`/api/vehicles/${initial.id}`, payload);
        toast.success("更新成功");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.field === "plateNo") {
          form.setError("plateNo", { message: err.message });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("操作失敗，請稍後再試");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "新增車輛" : "編輯車輛"}
          </DialogTitle>
          <DialogDescription>
            填寫車輛資料，車牌須唯一。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="plateNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>車牌</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>品牌</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>車型</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年份</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>狀態</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>使用者（選填）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="員工姓名"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "新增" : "儲存"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
