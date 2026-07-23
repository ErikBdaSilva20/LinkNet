import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "./use-toast";
import { createPage as createPageRepo, updatePage as updatePageRepo, removePage } from "@/lib/data/pages.repo";
import { createTheme } from "@/lib/data/themes.repo";
import { createIntegration } from "@/lib/data/integrations.repo";
import { removeLink } from "@/lib/data/links.repo";
import { getPublicPageByHandle } from "@/lib/data/public.repo";
import { encodeImageToDataUrl } from "@/lib/image";
import type { Page } from "@/lib/data/pages.repo";

export interface CreatePageInput {
  handle: string;
  display_name?: string;
  title?: string;
  description?: string;
}

// Handles reservados: colidem com rotas de topo já usadas pelo app (App.tsx).
const RESERVED_HANDLES = ["app", "login", "register", "l"];

// Mesmo regex do check constraint pages_handle_format (supabase/migrations/0001_business_schema.sql).
const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

export function usePages() {
  const { pages, setActivePage } = useActivePage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isValidHandle = (handle: string): boolean => {
    if (!HANDLE_REGEX.test(handle)) return false;
    if (RESERVED_HANDLES.includes(handle)) return false;
    return true;
  };

  // Checa unicidade: primeiro contra as próprias pages (rápido, sem rede), depois contra a
  // rota pública (única forma de saber se OUTRO usuário já usa o handle, já que o modo
  // genérico autenticado só devolve as pages do próprio dono).
  const isHandleAvailable = async (handle: string, currentPageId?: string): Promise<boolean> => {
    const ownCollision = pages.some((p) => p.handle === handle && p.id !== currentPageId);
    if (ownCollision) return false;

    const publicPage = await getPublicPageByHandle(handle);
    if (!publicPage) return true;
    return publicPage.page.id === currentPageId;
  };

  const createPageMutation = useMutation({
    mutationFn: async (input: CreatePageInput) => {
      if (!isValidHandle(input.handle)) {
        throw new Error("Handle inválido. Use letras minúsculas, números e _ (3-20 caracteres).");
      }

      const available = await isHandleAvailable(input.handle);
      if (!available) {
        throw new Error("Este handle já está em uso. Escolha outro.");
      }

      const newPage = await createPageRepo({
        handle: input.handle,
        display_name: input.display_name ?? null,
        title: input.title ?? null,
        description: input.description ?? null,
      });

      try {
        await createTheme({ page_id: newPage.id });
        await createIntegration({ page_id: newPage.id });
      } catch (error) {
        await removePage(newPage.id);
        throw error;
      }

      return newPage;
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setActivePage(newPage.id);
      toast({
        title: "Página criada!",
        description: `"${newPage.title || newPage.handle}" está pronta para ser personalizada.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar página",
        description: error.message,
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      if (pages.length <= 1) {
        throw new Error("Não é possível excluir a única página.");
      }

      // Filhas relevantes que o app grava (links). themes/integrations são 1:1 e órfãs não
      // atrapalham (nunca lidas sem page_id válido); não há endpoint de remove nesses repos
      // por não serem necessários no fluxo normal — a linha órfã fica inofensiva no tenant.
      const { listLinks } = await import("@/lib/data/links.repo");
      const linksOfPage = (await listLinks()).filter((l) => l.page_id === pageId);
      for (const link of linksOfPage) {
        await removeLink(link.id);
      }

      await removePage(pageId);
      return pageId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({
        title: "Página excluída",
        description: "A página foi removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir página",
        description: error.message,
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ pageId, updates }: { pageId: string; updates: Partial<Page> }) => {
      if (updates.handle) {
        if (!isValidHandle(updates.handle)) {
          throw new Error("Handle inválido.");
        }
        const available = await isHandleAvailable(updates.handle, pageId);
        if (!available) {
          throw new Error("Este handle já está em uso.");
        }
      }

      return updatePageRepo(pageId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({ title: "Página atualizada!" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    },
  });

  const uploadAvatar = async (pageId: string, file: File): Promise<string | null> => {
    try {
      const dataUrl = await encodeImageToDataUrl(file, { maxDim: 256 });
      await updatePageRepo(pageId, { avatar_url: dataUrl });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      return dataUrl;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Não foi possível processar a imagem.",
      });
      return null;
    }
  };

  return {
    pages,
    createPage: createPageMutation.mutate,
    createPageAsync: createPageMutation.mutateAsync,
    isCreating: createPageMutation.isPending,
    deletePage: deletePageMutation.mutate,
    isDeleting: deletePageMutation.isPending,
    updatePage: updatePageMutation.mutate,
    isUpdating: updatePageMutation.isPending,
    isValidHandle,
    isHandleAvailable,
    uploadAvatar,
  };
}
