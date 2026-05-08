import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Car, CheckCircle2, Plus, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { VehicleStatus } from "@/lib/schemas";

type DashboardStats = {
  totals: {
    vehicles: number;
    availableVehicles: number;
    employees: number;
    addedThisMonth: number;
  };
  statusDistribution: Array<{ status: VehicleStatus; count: number }>;
  monthlyAdded: Array<{ month: string; count: number }>;
};

const STATUS_LABEL: Record<VehicleStatus, string> = {
  available: "可用",
  "in-use": "使用中",
  maintenance: "維修中",
};

const statusChartConfig = {
  count: {
    label: "車輛數",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  count: {
    label: "新增車輛",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await api.get<DashboardStats>(
        "/api/dashboard/stats",
        signal,
      );
      setData(stats);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "無法載入數據");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive">無法載入數據：{error}</p>
        <Button onClick={() => load()}>重試</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">儀表板</h1>
        <p className="text-sm text-muted-foreground">
          當前車隊與員工概況
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="總車輛數"
              value={data.totals.vehicles}
              icon={Car}
            />
            <StatCard
              title="可用車輛數"
              value={data.totals.availableVehicles}
              icon={CheckCircle2}
            />
            <StatCard
              title="員工總數"
              value={data.totals.employees}
              icon={Users}
            />
            <StatCard
              title="本月新增車輛"
              value={data.totals.addedThisMonth}
              icon={Plus}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>車輛狀態分佈</CardTitle>
            <CardDescription>依目前狀態分類</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : data.statusDistribution.every((d) => d.count === 0) ? (
              <EmptyChart />
            ) : (
              <ChartContainer
                config={statusChartConfig}
                className="h-64 w-full"
              >
                <BarChart
                  data={data.statusDistribution.map((d) => ({
                    label: STATUS_LABEL[d.status],
                    count: d.count,
                  }))}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>近 6 個月新增車輛趨勢</CardTitle>
            <CardDescription>每月新增筆數</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : data.monthlyAdded.every((d) => d.count === 0) ? (
              <EmptyChart />
            ) : (
              <ChartContainer
                config={trendChartConfig}
                className="h-64 w-full"
              >
                <LineChart
                  data={data.monthlyAdded}
                  margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
      目前無資料
    </div>
  );
}
