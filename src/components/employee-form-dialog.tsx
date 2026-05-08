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
import { ApiException, api } from "@/lib/api";
import {
  employeeInputSchema,
  type Employee,
  type EmployeeInput,
} from "@/lib/schemas";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: Employee | null;
  onSuccess: () => void;
};

const EMPTY: EmployeeInput = {
  name: "",
  email: "",
  department: "",
  role: "",
  hireDate: new Date().toISOString().slice(0, 10),
};

export function EmployeeFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSuccess,
}: Props) {
  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeInputSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      form.reset({
        name: initial.name,
        email: initial.email,
        department: initial.department,
        role: initial.role,
        hireDate: initial.hireDate,
      });
    } else {
      form.reset(EMPTY);
    }
  }, [open, mode, initial, form]);

  const onSubmit = async (values: EmployeeInput) => {
    try {
      if (mode === "create") {
        await api.post<Employee>("/api/employees", values);
        toast.success("新增成功");
      } else if (initial) {
        await api.put<Employee>(`/api/employees/${initial.id}`, values);
        toast.success("更新成功");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.field === "email") {
          form.setError("email", { message: err.message });
        } else if (err.status === 403) {
          toast.error("權限不足");
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
            {mode === "create" ? "新增員工" : "編輯員工"}
          </DialogTitle>
          <DialogDescription>填寫員工資料，Email 須唯一。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部門</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>職稱</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>到職日</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
