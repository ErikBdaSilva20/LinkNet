import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "./use-toast";
import { listLinks, createLink as createLinkRepo, updateLink as updateLinkRepo, removeLink } from "@/lib/data/links.repo";
import { listLinkClicks } from "@/lib/data/link_clicks.repo";
import { encodeImageToDataUrl } from "@/lib/image";
import type { Link } from "@/lib/data/links.repo";
import type { Enums } from "@/lib/data/types.gen";

export type { Link };
type ThumbnailType = Enums<"thumbnail_type">;

export type LinkType = "link" | "header";

export interface CreateLinkInput {
  title: string;
  url?: string | null;
  link_type?: LinkType;
  thumbnail_type?: ThumbnailType;
  thumbnail_url?: string | null;
  icon_name?: string | null;
  schedule_enabled?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface UpdateLinkInput {
  id: string;
  title?: string;
  url?: string | null;
  link_type?: LinkType;
  thumbnail_type?: ThumbnailType;
  thumbnail_url?: string | null;
  icon_name?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  schedule_enabled?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export function useLinks() {
  const { pageId } = useActivePage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // list-then-filter: modo genérico não tem filtro server-side (§B5)
  const { data: links = [], isLoading, error } = useQuery({
    queryKey: ["links", pageId],
    queryFn: async (): Promise<Link[]> => {
      if (!pageId) return [];
      const all = await listLinks();
      return all
        .filter((l) => l.page_id === pageId)
        .sort((a, b) => a.position - b.position);
    },
    enabled: !!pageId,
  });

  const { data: clickCounts = {} } = useQuery({
    queryKey: ["link-clicks", pageId],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!pageId || links.length === 0) return {};

      const linkIds = new Set(links.map((l) => l.id));
      const allClicks = await listLinkClicks();

      const counts: Record<string, number> = {};
      allClicks
        .filter((click) => linkIds.has(click.link_id))
        .forEach((click) => {
          counts[click.link_id] = (counts[click.link_id] || 0) + 1;
        });
      return counts;
    },
    enabled: !!pageId && links.length > 0,
  });

  // Create link (at the TOP - position 0)
  const createLinkMutation = useMutation({
    mutationFn: async (input: CreateLinkInput) => {
      if (!pageId) throw new Error("Página não encontrada");

      // Shift all existing links down by 1 position (loop sequencial — sem batch no modo genérico)
      for (const link of links) {
        await updateLinkRepo(link.id, { position: link.position + 1 });
      }

      await createLinkRepo({
        page_id: pageId,
        title: input.title,
        url: input.url || null,
        link_type: input.link_type || "link",
        thumbnail_type: input.thumbnail_type || "none",
        thumbnail_url: input.thumbnail_url,
        icon_name: input.icon_name,
        schedule_enabled: input.schedule_enabled || false,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        position: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", pageId] });
      toast({ title: "Link criado", description: "Seu link foi adicionado no topo da lista." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao criar link", description: error.message });
    },
  });

  // Update link with optimistic UI
  const updateLinkMutation = useMutation({
    mutationFn: async (input: UpdateLinkInput) => {
      const { id, ...updates } = input;
      await updateLinkRepo(id, updates);
    },
    onMutate: async (input: UpdateLinkInput) => {
      await queryClient.cancelQueries({ queryKey: ["links", pageId] });
      const previousLinks = queryClient.getQueryData<Link[]>(["links", pageId]);

      if (previousLinks) {
        const updatedLinks = previousLinks.map((link) =>
          link.id === input.id ? { ...link, ...input } : link
        );
        queryClient.setQueryData(["links", pageId], updatedLinks);
      }

      return { previousLinks };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(["links", pageId], context.previousLinks);
      }
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links", pageId] });
    },
  });

  // Delete link
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await removeLink(linkId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", pageId] });
      toast({ title: "Link excluído", description: "O link foi removido." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    },
  });

  // Reorder links with optimistic UI
  const reorderLinksMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      let index = 0;
      for (const id of orderedIds) {
        await updateLinkRepo(id, { position: index });
        index += 1;
      }
    },
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["links", pageId] });
      const previousLinks = queryClient.getQueryData<Link[]>(["links", pageId]);

      if (previousLinks) {
        const reorderedLinks = orderedIds.map((id, index) => {
          const link = previousLinks.find((l) => l.id === id)!;
          return { ...link, position: index };
        });
        queryClient.setQueryData(["links", pageId], reorderedLinks);
      }

      return { previousLinks };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(["links", pageId], context.previousLinks);
      }
      toast({ variant: "destructive", title: "Erro ao reordenar", description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links", pageId] });
    },
  });

  // Upload thumbnail
  const uploadThumbnail = async (linkId: string, file: File): Promise<string | null> => {
    try {
      const dataUrl = await encodeImageToDataUrl(file, { maxDim: 128 });
      await updateLinkRepo(linkId, { thumbnail_url: dataUrl });
      queryClient.invalidateQueries({ queryKey: ["links", pageId] });
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
    links,
    isLoading,
    error,
    clickCounts,
    pageId,
    createLink: createLinkMutation.mutate,
    updateLink: updateLinkMutation.mutate,
    deleteLink: deleteLinkMutation.mutate,
    reorderLinks: reorderLinksMutation.mutate,
    isCreating: createLinkMutation.isPending,
    isUpdating: updateLinkMutation.isPending,
    isDeleting: deleteLinkMutation.isPending,
    isReordering: reorderLinksMutation.isPending,
    uploadThumbnail,
  };
}
