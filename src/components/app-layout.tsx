import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Car, Users, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "儀表板", icon: LayoutDashboard, adminOnly: false, end: true },
  { to: "/vehicles", label: "車輛管理", icon: Car, adminOnly: false, end: false },
  { to: "/employees", label: "員工管理", icon: Users, adminOnly: true, end: false },
  { to: "/history", label: "修改歷史", icon: History, adminOnly: false, end: false },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="h-14 px-4 flex items-center border-b">
          <span className="font-semibold">車輛管理系統</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === "admin")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="p-3 border-t space-y-2">
          <div className="text-xs text-muted-foreground">
            登入身分
          </div>
          <div className="text-sm font-medium">
            {user?.username}{" "}
            <span className="text-muted-foreground">({user?.role})</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
