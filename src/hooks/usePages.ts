import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "./use-toast";

export interface CreatePageInput {
  title: string;
  slug: string;
  description?: string;
}

// Reserved slugs that cannot be used
const RESERVED_SLUGS = ["settings", "links", "analytics", "design", "leads", "app"];

// Slug validation regex: lowercase letters, numbers, hyphens, 3-30 chars
const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;

export function usePages() {
  const { pages, profileId, setActivePage } = useActivePage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Validate slug format
  const isValidSlug = (slug: string): boolean => {
    if (!SLUG_REGEX.test(slug)) return false;
    if (RESERVED_SLUGS.includes(slug)) return false;
    if (slug.startsWith("-") || slug.endsWith("-")) return false;
    return true;
  };

  // Check if slug is available for user
  const isSlugAvailable = async (slug: string): Promise<boolean> => {
    if (!profileId) return false;
    const exists = pages.some((p) => p.slug === slug);
    return !exists;
  };

  // Create new page
  const createPageMutation = useMutation({
    mutationFn: async (input: CreatePageInput) => {
      if (!profileId) throw new Error("Perfil não encontrado");

      // Validate slug
      if (!isValidSlug(input.slug)) {
        throw new Error("Slug inválido. Use apenas letras minúsculas, números e hífens (3-30 caracteres).");
      }

      // Check availability
      const available = await isSlugAvailable(input.slug);
      if (!available) {
        throw new Error("Este slug já está em uso. Escolha outro.");
      }

      // Verify user authentication and profile ownership
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: ownedProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", profileId)
        .single();

      if (profileError || !ownedProfile) {
        throw new Error("Perfil não pertence ao usuário autenticado");
      }

      // Create the page (separate insert and select to avoid RLS conflicts)
      const { error: pageError } = await supabase
        .from("pages")
        .insert({
          profile_id: profileId,
          title: input.title,
          slug: input.slug,
          description: input.description || null,
        });

      if (pageError) throw pageError;

      // Fetch the newly created page
      const { data: newPage, error: fetchError } = await supabase
        .from("pages")
        .select("*")
        .eq("profile_id", profileId)
        .eq("slug", input.slug)
        .single();

      if (fetchError || !newPage) throw fetchError || new Error("Página criada mas não encontrada");

      // Create default theme for the page
      const { error: themeError } = await supabase
        .from("themes")
        .insert({ page_id: newPage.id });

      if (themeError) {
        // Rollback page creation
        await supabase.from("pages").delete().eq("id", newPage.id);
        throw themeError;
      }

      // Create default integrations for the page
      const { error: intError } = await supabase
        .from("integrations")
        .insert({ page_id: newPage.id });

      if (intError) {
        // Rollback
        await supabase.from("themes").delete().eq("page_id", newPage.id);
        await supabase.from("pages").delete().eq("id", newPage.id);
        throw intError;
      }

      return newPage;
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["pages", profileId] });
      setActivePage(newPage.id);
      toast({
        title: "Página criada!",
        description: `"${newPage.title}" está pronta para ser personalizada.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar página",
        description: error.message,
      });
    },
  });

  // Delete page
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      if (!profileId) throw new Error("Perfil não encontrado");

      // Find the page to delete
      const pageToDelete = pages.find((p) => p.id === pageId);
      if (!pageToDelete) throw new Error("Página não encontrada");

      // Cannot delete main page (the one without slug)
      if (!pageToDelete.slug) {
        throw new Error("Não é possível excluir a página principal.");
      }

      // Delete will cascade to links, theme, integrations due to FK constraints
      // But we handle it explicitly for safety
      await supabase.from("links").delete().eq("page_id", pageId);
      await supabase.from("themes").delete().eq("page_id", pageId);
      await supabase.from("integrations").delete().eq("page_id", pageId);
      
      const { error } = await supabase.from("pages").delete().eq("id", pageId);
      if (error) throw error;

      return pageId;
    },
    onSuccess: (deletedPageId) => {
      queryClient.invalidateQueries({ queryKey: ["pages", profileId] });
      
      // Switch to main page if we deleted the active one
      const mainPage = pages.find((p) => !p.slug);
      if (mainPage) {
        setActivePage(mainPage.id);
      }
      
      toast({
        title: "Página excluída",
        description: "A página foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir página",
        description: error.message,
      });
    },
  });

  // Update page
  const updatePageMutation = useMutation({
    mutationFn: async ({ pageId, updates }: { pageId: string; updates: Record<string, unknown> }) => {
      // Validate slug if provided
      if (updates.slug && typeof updates.slug === 'string') {
        if (!isValidSlug(updates.slug)) {
          throw new Error("Slug inválido.");
        }
        const page = pages.find((p) => p.id === pageId);
        if (page?.slug !== updates.slug) {
          const available = await isSlugAvailable(updates.slug);
          if (!available) {
            throw new Error("Este slug já está em uso.");
          }
        }
      }

      const { error } = await supabase
        .from("pages")
        .update(updates)
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", profileId] });
      toast({ title: "Página atualizada!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    },
  });

  return {
    pages,
    createPage: createPageMutation.mutate,
    createPageAsync: createPageMutation.mutateAsync,
    isCreating: createPageMutation.isPending,
    deletePage: deletePageMutation.mutate,
    isDeleting: deletePageMutation.isPending,
    updatePage: updatePageMutation.mutate,
    isUpdating: updatePageMutation.isPending,
    isValidSlug,
    isSlugAvailable,
  };
}
