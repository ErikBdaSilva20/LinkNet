// Wrapper de conveniência sobre usePages()/useActivePage() — profiles foi fundida em pages
// (docs/plano-construcao/02-schema-migracao.md, Decisão 1). Mantido para não obrigar Bloco 5
// a reescrever os 6 consumidores de useProfile() só por causa da fusão de tabela; a reescrita
// real dessas telas (se fizer sentido consumir usePages/useActivePage direto) é do Bloco 5.
import { useActivePage } from "@/contexts/ActivePageContext";
import { usePages } from "./usePages";
import type { Page } from "@/lib/data/pages.repo";

export function useProfile() {
  const { page, isLoading } = useActivePage();
  const { updatePage, isUpdating, isHandleAvailable, uploadAvatar: uploadPageAvatar } = usePages();

  const checkHandleUniqueness = async (handle: string): Promise<boolean> => {
    if (!page) return false;
    return isHandleAvailable(handle, page.id);
  };

  const updateProfile = (
    updates: Partial<Pick<Page, "display_name" | "handle" | "bio" | "avatar_url" | "is_public">>
  ) => {
    if (!page) return;
    updatePage({ pageId: page.id, updates });
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!page) return null;
    return uploadPageAvatar(page.id, file);
  };

  return {
    profile: page,
    isLoading,
    error: null,
    checkHandleUniqueness,
    updateProfile,
    isUpdating,
    uploadAvatar,
  };
}
