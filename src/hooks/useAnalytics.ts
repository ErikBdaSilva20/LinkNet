import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useLinks, type Link } from "./useLinks";
import { format, subDays, differenceInDays, startOfDay, endOfDay } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type PageView = Tables<"page_views">;
type LinkClick = Tables<"link_clicks">;

export interface DailyStats {
  date: string;
  views: number;
  clicks: number;
}

export interface TopLink {
  id: string;
  title: string;
  url: string;
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

// Aggregation helpers
const aggregateDailyStats = (
  views: PageView[],
  clicks: LinkClick[],
  startDate: Date,
  endDate: Date
): DailyStats[] => {
  const stats: Record<string, { views: number; clicks: number }> = {};

  // Initialize all days in the period
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = format(current, "yyyy-MM-dd");
    stats[key] = { views: 0, clicks: 0 };
    current.setDate(current.getDate() + 1);
  }

  // Aggregate views
  views.forEach((v) => {
    const key = format(new Date(v.created_at), "yyyy-MM-dd");
    if (stats[key]) stats[key].views++;
  });

  // Aggregate clicks
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

interface UseAnalyticsOptions {
  startDate: Date;
  endDate: Date;
}

export function useAnalytics({ startDate, endDate }: UseAnalyticsOptions) {
  const { pageId } = useActivePage();
  const { links } = useLinks();

  // Calculate previous period for comparison
  const periodDays = differenceInDays(endDate, startDate);
  const previousEndDate = subDays(startDate, 1);
  const previousStartDate = subDays(previousEndDate, periodDays);

  // Fetch page views for current period
  const { data: currentViews = [], isLoading: isLoadingViews } = useQuery({
    queryKey: ["analytics-views", pageId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<PageView[]> => {
      if (!pageId) return [];

      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .eq("page_id", pageId)
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endOfDay(endDate).toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId,
  });

  // Fetch page views for previous period
  const { data: previousViews = [] } = useQuery({
    queryKey: ["analytics-views-prev", pageId, previousStartDate.toISOString(), previousEndDate.toISOString()],
    queryFn: async (): Promise<PageView[]> => {
      if (!pageId) return [];

      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .eq("page_id", pageId)
        .gte("created_at", startOfDay(previousStartDate).toISOString())
        .lte("created_at", endOfDay(previousEndDate).toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId,
  });

  // Fetch link clicks for current period
  const { data: currentClicks = [], isLoading: isLoadingClicks } = useQuery({
    queryKey: ["analytics-clicks", pageId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<LinkClick[]> => {
      if (!pageId || links.length === 0) return [];

      const linkIds = links.map((l) => l.id);

      const { data, error } = await supabase
        .from("link_clicks")
        .select("*")
        .in("link_id", linkIds)
        .gte("clicked_at", startOfDay(startDate).toISOString())
        .lte("clicked_at", endOfDay(endDate).toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId && links.length > 0,
  });

  // Fetch link clicks for previous period
  const { data: previousClicks = [] } = useQuery({
    queryKey: ["analytics-clicks-prev", pageId, previousStartDate.toISOString(), previousEndDate.toISOString()],
    queryFn: async (): Promise<LinkClick[]> => {
      if (!pageId || links.length === 0) return [];

      const linkIds = links.map((l) => l.id);

      const { data, error } = await supabase
        .from("link_clicks")
        .select("*")
        .in("link_id", linkIds)
        .gte("clicked_at", startOfDay(previousStartDate).toISOString())
        .lte("clicked_at", endOfDay(previousEndDate).toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId && links.length > 0,
  });

  // Calculate metrics
  const totalViews = currentViews.length;
  const totalClicks = currentClicks.length;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const previousTotalViews = previousViews.length;
  const previousTotalClicks = previousClicks.length;
  const previousCtr = previousTotalViews > 0 ? (previousTotalClicks / previousTotalViews) * 100 : 0;

  // Aggregate data
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
