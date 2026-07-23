import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { listPages, type Page } from "@/lib/data/pages.repo";

interface ActivePageContextType {
  pageId: string | null;
  page: Page | null;
  pages: Page[];
  isLoading: boolean;
  setActivePage: (pageId: string) => void;
}

const ActivePageContext = createContext<ActivePageContextType | null>(null);

const STORAGE_KEY = "active-page-id";

export function ActivePageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activePageId, setActivePageId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  // Fetch all pages do usuário logado (o gateway já só devolve as próprias — sem filtro extra)
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["pages", user?.id],
    queryFn: listPages,
    enabled: !!user?.id,
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
