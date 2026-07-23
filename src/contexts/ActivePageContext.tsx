import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Page = Tables<"pages">;

interface ActivePageContextType {
  pageId: string | null;
  page: Page | null;
  pages: Page[];
  isLoading: boolean;
  setActivePage: (pageId: string) => void;
  profileId: string | null;
}

const ActivePageContext = createContext<ActivePageContextType | null>(null);

const STORAGE_KEY = "active-page-id";

export function ActivePageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activePageId, setActivePageId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all pages for user
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["pages", profile?.id],
    queryFn: async (): Promise<Page[]> => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Find current page from pages list
  const currentPage = pages.find((p) => p.id === activePageId) || pages[0] || null;

  // Auto-select first page if none selected or selected is invalid
  useEffect(() => {
    if (pages.length > 0) {
      const validPage = pages.find((p) => p.id === activePageId);
      if (!validPage) {
        const firstPage = pages[0];
        setActivePageId(firstPage.id);
        localStorage.setItem(STORAGE_KEY, firstPage.id);
      }
    }
  }, [pages, activePageId]);

  const setActivePage = (pageId: string) => {
    setActivePageId(pageId);
    localStorage.setItem(STORAGE_KEY, pageId);
    // Invalidate queries that depend on page
    queryClient.invalidateQueries({ queryKey: ["links"] });
    queryClient.invalidateQueries({ queryKey: ["theme"] });
    queryClient.invalidateQueries({ queryKey: ["integrations"] });
  };

  return (
    <ActivePageContext.Provider
      value={{
        pageId: currentPage?.id || null,
        page: currentPage,
        pages,
        isLoading,
        setActivePage,
        profileId: profile?.id || null,
      }}
    >
      {children}
    </ActivePageContext.Provider>
  );
}

export function useActivePage() {
  const context = useContext(ActivePageContext);
  if (!context) {
    throw new Error("useActivePage must be used within an ActivePageProvider");
  }
  return context;
}
