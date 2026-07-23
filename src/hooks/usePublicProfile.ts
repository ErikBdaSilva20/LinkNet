import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Page = Tables<"pages">;
type Link = Tables<"links">;
type Theme = Tables<"themes">;
type Integration = Tables<"integrations">;

export interface PublicProfileData {
  profile: Profile;
  page: Page;
  links: Link[];
  theme: Theme | null;
  integrations: Integration | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function usePublicProfile(handle: string | undefined, pageSlug?: string) {
  const viewTrackedRef = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-profile", handle, pageSlug],
    queryFn: async (): Promise<PublicProfileData | null> => {
      if (!handle) return null;

      // Fetch profile by handle (RLS ensures only public profiles are returned)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .eq("is_public", true)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return null;

      // Fetch page - by slug if provided, or main page (null slug)
      let pageQuery = supabase
        .from("pages")
        .select("*")
        .eq("profile_id", profile.id);

      if (pageSlug) {
        // Fetch specific page by slug
        pageQuery = pageQuery.eq("slug", pageSlug);
      } else {
        // Fetch main page (null slug) or first page as fallback
        pageQuery = pageQuery.is("slug", null);
      }

      const { data: page, error: pageError } = await pageQuery.maybeSingle();

      // If no page found with null slug, try getting the first page
      if (!page && !pageSlug) {
        const { data: firstPage, error: firstPageError } = await supabase
          .from("pages")
          .select("*")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstPageError) throw firstPageError;
        if (!firstPage) return null;

        // Continue with first page
        return fetchPageData(profile, firstPage);
      }

      if (pageError) throw pageError;
      if (!page) return null;

      return fetchPageData(profile, page);
    },
    enabled: !!handle,
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  // Helper function to fetch page data
  async function fetchPageData(profile: Profile, page: Page): Promise<PublicProfileData> {
    // Fetch active links (RLS handles schedule filtering via is_link_scheduled_active)
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("*")
      .eq("page_id", page.id)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("position", { ascending: true });

    if (linksError) throw linksError;

    // Filter links by schedule on client-side as well
    const now = new Date();
    const filteredLinks = (links || []).filter((link) => {
      if (!link.schedule_enabled) return true;
      
      const startsAt = link.starts_at ? new Date(link.starts_at) : null;
      const endsAt = link.ends_at ? new Date(link.ends_at) : null;
      
      if (startsAt && now < startsAt) return false;
      if (endsAt && now > endsAt) return false;
      
      return true;
    });

    // Fetch theme
    const { data: theme, error: themeError } = await supabase
      .from("themes")
      .select("*")
      .eq("page_id", page.id)
      .maybeSingle();

    if (themeError) throw themeError;

    // Fetch integrations
    const { data: integrations } = await supabase
      .from("integrations")
      .select("*")
      .eq("page_id", page.id)
      .maybeSingle();

    return {
      profile,
      page,
      links: filteredLinks,
      theme,
      integrations,
    };
  }

  // Track page view (fire-and-forget)
  useEffect(() => {
    if (data?.page?.id && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      
      fetch(`${SUPABASE_URL}/functions/v1/track-view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_id: data.page.id,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        }),
      }).catch(() => {
        // Silently ignore tracking errors
      });
    }
  }, [data?.page?.id]);

  // Track link click (fire-and-forget)
  const trackClick = useCallback((linkId: string) => {
    fetch(`${SUPABASE_URL}/functions/v1/track-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        link_id: linkId,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently ignore tracking errors
    });
  }, []);

  return {
    profile: data?.profile || null,
    page: data?.page || null,
    links: data?.links || [],
    theme: data?.theme || null,
    integrations: data?.integrations || null,
    isLoading,
    error,
    trackClick,
  };
}
