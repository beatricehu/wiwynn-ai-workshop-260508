import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ApiException } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { loginSchema, type LoginInput } from "@/lib/schemas";

type LocationState = { from?: { pathname: string } } | null;

export default function LoginPage() {
  const { isAuthenticated, isHydrated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await login(values.username, values.password);
      const state = location.state as LocationState;
      const target = state?.from?.pathname ?? "/";
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof ApiException) {
        setServerError(err.message);
      } else {
        setServerError("登入失敗，請稍後再試");
      }
    }
  };

  if (!isHydrated) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">車輛管理系統</CardTitle>
          <CardDescription>請輸入帳號密碼登入</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>帳號</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="username"
                        placeholder="admin / user"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密碼</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError && (
                <p className="text-sm text-destructive" role="alert">
                  {serverError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                登入
              </Button>
              <p className="text-xs text-muted-foreground pt-2">
                測試帳號：admin / admin123、user / user123
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
