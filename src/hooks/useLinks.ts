import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "./use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type Link = Tables<"links">;
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

  // Fetch links for user's page
  const { data: links = [], isLoading, error } = useQuery({
    queryKey: ["links", pageId],
    queryFn: async (): Promise<Link[]> => {
      if (!pageId) return [];

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("page_id", pageId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId,
  });

  // Get click counts for links
  const { data: clickCounts = {} } = useQuery({
    queryKey: ["link-clicks", pageId],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!pageId) return {};

      const linkIds = links.map((l) => l.id);
      if (linkIds.length === 0) return {};

      const { data, error } = await supabase
        .from("link_clicks")
        .select("link_id")
        .in("link_id", linkIds);

      if (error) throw error;

      // Count clicks per link
      const counts: Record<string, number> = {};
      data?.forEach((click) => {
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

      // First, shift all existing links down by 1 position
      if (links.length > 0) {
        const updates = links.map((link) => ({
          id: link.id,
          position: link.position + 1,
        }));

        for (const update of updates) {
          await supabase
            .from("links")
            .update({ position: update.position })
            .eq("id", update.id);
        }
      }

      // Insert new link at position 0 (top)
      const { error } = await supabase.from("links").insert({
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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", pageId] });
      toast({ title: "Link criado", description: "Seu link foi adicionado no topo da lista." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao criar link", description: error.message });
    },
  });

  // Update link with optimistic UI
  const updateLinkMutation = useMutation({
    mutationFn: async (input: UpdateLinkInput) => {
      const { id, ...updates } = input;
      
      const { error } = await supabase
        .from("links")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async (input: UpdateLinkInput) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["links", pageId] });

      // Snapshot previous value
      const previousLinks = queryClient.getQueryData<Link[]>(["links", pageId]);

      // Optimistically update
      if (previousLinks) {
        const updatedLinks = previousLinks.map((link) =>
          link.id === input.id ? { ...link, ...input } : link
        );
        queryClient.setQueryData(["links", pageId], updatedLinks);
      }

      return { previousLinks };
    },
    onError: (error, _, context) => {
      // Rollback on error
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
      const { error } = await supabase.from("links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", pageId] });
      toast({ title: "Link excluído", description: "O link foi removido." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    },
  });

  // Reorder links with optimistic UI
  const reorderLinksMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        position: index,
      }));

      // Update each link's position
      for (const update of updates) {
        const { error } = await supabase
          .from("links")
          .update({ position: update.position })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onMutate: async (orderedIds: string[]) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["links", pageId] });

      // Snapshot previous value
      const previousLinks = queryClient.getQueryData<Link[]>(["links", pageId]);

      // Optimistically update
      if (previousLinks) {
        const reorderedLinks = orderedIds.map((id, index) => {
          const link = previousLinks.find((l) => l.id === id)!;
          return { ...link, position: index };
        });
        queryClient.setQueryData(["links", pageId], reorderedLinks);
      }

      return { previousLinks };
    },
    onError: (error, _, context) => {
      // Rollback on error
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
    if (!pageId) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${pageId}/${linkId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("thumbnails")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: uploadError.message,
      });
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
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
