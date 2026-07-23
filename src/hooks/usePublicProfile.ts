import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicPageByHandle, trackLinkClick, type PublicPageData } from "@/lib/data/public.repo";
import type { Tables } from "@/lib/data/types.gen";

type Link = Tables<"links">;

// Endereçamento é sempre /:handle (um parâmetro) — a fusão profiles+pages (Bloco 2, Decisão 1)
// eliminou o conceito de sub-página por slug.
export function usePublicProfile(handle: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-page", handle],
    queryFn: async (): Promise<PublicPageData | null> => {
      if (!handle) return null;
      return getPublicPageByHandle(handle);
    },
    enabled: !!handle,
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  // Filtro de agendamento é 100% client-side agora — não há mais RLS/função de servidor por
  // trás (ver docs/plano-construcao/04-camada-de-dados.md, "Decisões já tomadas"). Esta é a
  // ÚNICA proteção de visibilidade por janela de tempo; não remover nem enfraquecer.
  const now = new Date();
  const filteredLinks: Link[] = (data?.links || []).filter((link) => {
    if (!link.schedule_enabled) return true;

    const startsAt = link.starts_at ? new Date(link.starts_at) : null;
    const endsAt = link.ends_at ? new Date(link.ends_at) : null;

    if (startsAt && now < startsAt) return false;
    if (endsAt && now > endsAt) return false;

    return true;
  });

  // Track link click (fire-and-forget) — rota pública já existente (§B6, LinkHub).
  const trackClick = useCallback((linkId: string) => {
    trackLinkClick(linkId);
  }, []);

  return {
    page: data?.page || null,
    links: filteredLinks,
    theme: data?.theme || null,
    integrations: data?.integrations || null,
    isLoading,
    error,
    trackClick,
  };
}
