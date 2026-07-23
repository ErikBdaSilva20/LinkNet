import { useQuery } from "@tanstack/react-query";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useLinks, type Link } from "./useLinks";
import { listPageViews, type PageView } from "@/lib/data/page_views.repo";
import { listLinkClicks } from "@/lib/data/link_clicks.repo";
import type { LinkClick } from "@/lib/data/link_clicks.repo";
import { format, subDays, differenceInDays, startOfDay, endOfDay } from "date-fns";

export interface DailyStats {
  date: string;
  views: number;
  clicks: number;
}

export interface TopLink {
  id: string;
  title: string;
  url: string | null;
  clicks: number;
}

export interface ReferrerStats {
  referrer: string;
  count: number;
}

export interface DeviceStats {
  device: string;
  count: number;
}

export interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  dailyStats: DailyStats[];
  topLinks: TopLink[];
  topReferrers: ReferrerStats[];
  deviceBreakdown: DeviceStats[];
  previousTotalViews: number;
  previousTotalClicks: number;
  previousCtr: number;
}

// Aggregation helpers (puras — não mudam com a troca de fonte de dado)
const aggregateDailyStats = (
  views: PageView[],
  clicks: LinkClick[],
  startDate: Date,
  endDate: Date
): DailyStats[] => {
  const stats: Record<string, { views: number; clicks: number }> = {};

  const current = new Date(startDate);
  while (current <= endDate) {
    const key = format(current, "yyyy-MM-dd");
    stats[key] = { views: 0, clicks: 0 };
    current.setDate(current.getDate() + 1);
  }

  views.forEach((v) => {
    const key = format(new Date(v.created_at), "yyyy-MM-dd");
    if (stats[key]) stats[key].views++;
  });

  clicks.forEach((c) => {
    const key = format(new Date(c.clicked_at), "yyyy-MM-dd");
    if (stats[key]) stats[key].clicks++;
  });

  return Object.entries(stats)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const aggregateTopLinks = (clicks: LinkClick[], links: Link[]): TopLink[] => {
  const clicksByLink: Record<string, number> = {};

  clicks.forEach((c) => {
    clicksByLink[c.link_id] = (clicksByLink[c.link_id] || 0) + 1;
  });

  return links
    .map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      clicks: clicksByLink[link.id] || 0,
    }))
    .filter((l) => l.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
};

const aggregateReferrers = (views: PageView[]): ReferrerStats[] => {
  const counts: Record<string, number> = {};

  views.forEach((v) => {
    let domain = "Direto";
    try {
      if (v.referrer) {
        domain = new URL(v.referrer).hostname;
      }
    } catch {
      // Invalid URL, use "Direto"
    }
    counts[domain] = (counts[domain] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

const aggregateDevices = (views: PageView[]): DeviceStats[] => {
  const counts: Record<string, number> = {};

  views.forEach((v) => {
    const device = v.device_type || "Desconhecido";
    counts[device] = (counts[device] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);
};

const isWithin = (isoDate: string, start: Date, end: Date): boolean => {
  const d = new Date(isoDate).getTime();
  return d >= start.getTime() && d <= end.getTime();
};

interface UseAnalyticsOptions {
  startDate: Date;
  endDate: Date;
}

export function useAnalytics({ startDate, endDate }: UseAnalyticsOptions) {
  const { pageId } = useActivePage();
  const { links } = useLinks();

  const periodDays = differenceInDays(endDate, startDate);
  const previousEndDate = subDays(startDate, 1);
  const previousStartDate = subDays(previousEndDate, periodDays);

  // Escalabilidade (Bloco 4, Story 4.8): sem filtro/paginação server-side no modo genérico,
  // então puxamos cada tabela UMA vez só e derivamos os dois períodos em memória — reduz de
  // 4 chamadas de rede pra 2. staleTime alto porque analytics não precisa ser real-time.
  const { data: allViews = [], isLoading: isLoadingViews } = useQuery({
    queryKey: ["analytics-views", pageId],
    queryFn: async (): Promise<PageView[]> => {
      if (!pageId) return [];
      const all = await listPageViews();
      return all.filter((v) => v.page_id === pageId);
    },
    enabled: !!pageId,
    staleTime: 5 * 60 * 1000,
  });

  const linkIds = new Set(links.map((l) => l.id));

  const { data: allClicks = [], isLoading: isLoadingClicks } = useQuery({
    queryKey: ["analytics-clicks", pageId, links.length],
    queryFn: async (): Promise<LinkClick[]> => {
      if (!pageId || links.length === 0) return [];
      const all = await listLinkClicks();
      return all.filter((c) => linkIds.has(c.link_id));
    },
    enabled: !!pageId && links.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const currentStart = startOfDay(startDate);
  const currentEnd = endOfDay(endDate);
  const previousStart = startOfDay(previousStartDate);
  const previousEnd = endOfDay(previousEndDate);

  const currentViews = allViews.filter((v) => isWithin(v.created_at, currentStart, currentEnd));
  const previousViews = allViews.filter((v) => isWithin(v.created_at, previousStart, previousEnd));
  const currentClicks = allClicks.filter((c) => isWithin(c.clicked_at, currentStart, currentEnd));
  const previousClicks = allClicks.filter((c) => isWithin(c.clicked_at, previousStart, previousEnd));

  const totalViews = currentViews.length;
  const totalClicks = currentClicks.length;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const previousTotalViews = previousViews.length;
  const previousTotalClicks = previousClicks.length;
  const previousCtr = previousTotalViews > 0 ? (previousTotalClicks / previousTotalViews) * 100 : 0;

  const dailyStats = aggregateDailyStats(currentViews, currentClicks, startDate, endDate);
  const topLinks = aggregateTopLinks(currentClicks, links);
  const topReferrers = aggregateReferrers(currentViews);
  const deviceBreakdown = aggregateDevices(currentViews);

  const analyticsData: AnalyticsData = {
    totalViews,
    totalClicks,
    ctr,
    dailyStats,
    topLinks,
    topReferrers,
    deviceBreakdown,
    previousTotalViews,
    previousTotalClicks,
    previousCtr,
  };

  return {
    data: analyticsData,
    isLoading: isLoadingViews || isLoadingClicks,
  };
}

// Helper to calculate percentage change
export function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
  }
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
}
