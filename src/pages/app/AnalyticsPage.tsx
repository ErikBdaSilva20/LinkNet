import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CalendarIcon,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useAnalytics, calculateChange } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const periods = [
  { id: "7d", label: "7 dias", days: 7 },
  { id: "28d", label: "28 dias", days: 28 },
  { id: "90d", label: "90 dias", days: 90 },
  { id: "custom", label: "Personalizado", days: 0 },
];

const chartConfig: ChartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
  clicks: {
    label: "Clicks",
    color: "hsl(var(--chart-2))",
  },
};

const getDeviceIcon = (device: string) => {
  const normalized = device.toLowerCase();
  if (normalized.includes("mobile")) return Smartphone;
  if (normalized.includes("tablet")) return Tablet;
  if (normalized.includes("desktop")) return Monitor;
  return Globe;
};

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Calculate dates based on selected period
  const { startDate, endDate } = useMemo(() => {
    if (selectedPeriod === "custom" && customRange?.from && customRange?.to) {
      return { startDate: customRange.from, endDate: customRange.to };
    }
    const period = periods.find((p) => p.id === selectedPeriod);
    const end = new Date();
    const start = subDays(end, period?.days || 7);
    return { startDate: start, endDate: end };
  }, [selectedPeriod, customRange]);

  const { data, isLoading } = useAnalytics({ startDate, endDate });

  const viewsChange = calculateChange(data.totalViews, data.previousTotalViews);
  const clicksChange = calculateChange(data.totalClicks, data.previousTotalClicks);
  const ctrChange = calculateChange(data.ctr, data.previousCtr);

  const stats = [
    {
      label: "Total Views",
      value: data.totalViews.toLocaleString(),
      icon: Eye,
      change: viewsChange,
    },
    {
      label: "Total Cliques",
      value: data.totalClicks.toLocaleString(),
      icon: MousePointerClick,
      change: clicksChange,
    },
    {
      label: "CTR",
      value: `${data.ctr.toFixed(1)}%`,
      icon: TrendingUp,
      change: ctrChange,
    },
  ];

  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriod(periodId);
    if (periodId !== "custom") {
      setCustomRange(undefined);
    }
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      setIsCalendarOpen(false);
    }
  };

  const isEmpty = data.totalViews === 0 && data.totalClicks === 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe o desempenho da sua página
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl flex-wrap">
            {periods.map((period) => (
              <div key={period.id}>
                {period.id === "custom" ? (
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={selectedPeriod === "custom" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePeriodChange("custom")}
                        className={cn(
                          "rounded-lg gap-2",
                          selectedPeriod === "custom" && "gradient-primary text-primary-foreground"
                        )}
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {customRange?.from && customRange?.to
                          ? `${format(customRange.from, "dd/MM")} - ${format(customRange.to, "dd/MM")}`
                          : period.label}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={customRange}
                        onSelect={handleCustomRangeSelect}
                        numberOfMonths={2}
                        locale={ptBR}
                        className="pointer-events-auto"
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Button
                    variant={selectedPeriod === period.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePeriodChange(period.id)}
                    className={cn(
                      "rounded-lg",
                      selectedPeriod === period.id && "gradient-primary text-primary-foreground"
                    )}
                  >
                    {period.label}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : isEmpty ? (
          /* Empty State */
          <GlassCard className="p-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum dado ainda</h3>
              <p className="text-muted-foreground">
                Compartilhe sua página para começar a ver analytics.
              </p>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <GlassCard key={stat.label} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-sm mt-1",
                          stat.change.isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-destructive"
                        )}
                      >
                        {stat.change.isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>
                          {stat.change.isPositive ? "+" : "-"}
                          {stat.change.value.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Chart */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Atividade ao Longo do Tempo
              </h3>
              <div className="h-72">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.dailyStats}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => format(new Date(d), "dd/MM")}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) =>
                              format(new Date(value), "dd 'de' MMMM", { locale: ptBR })
                            }
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#colorViews)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="hsl(var(--chart-2))"
                        fill="url(#colorClicks)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </GlassCard>

            {/* Bottom Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Links */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Links Mais Clicados
                </h3>
                {data.topLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <MousePointerClick className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum clique registrado neste período
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead className="text-right">Cliques</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topLinks.map((link, index) => (
                        <TableRow key={link.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="font-medium truncate">{link.title}</p>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground truncate flex items-center gap-1 hover:text-primary"
                              >
                                {link.url}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {link.clicks.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </GlassCard>

              {/* Traffic Sources */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Origem do Tráfego
                </h3>
                {data.topReferrers.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhuma visita registrada neste período
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.topReferrers.map((referrer) => {
                      const percentage = (referrer.count / data.totalViews) * 100;
                      return (
                        <div key={referrer.referrer} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate">{referrer.referrer}</span>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              {referrer.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Device Breakdown */}
            {data.deviceBreakdown.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Dispositivos
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.deviceBreakdown.map((device) => {
                    const percentage = (device.count / data.totalViews) * 100;
                    const Icon = getDeviceIcon(device.device);
                    return (
                      <div
                        key={device.device}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/30"
                      >
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium capitalize truncate">{device.device}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.count.toLocaleString()} visitas ({percentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
