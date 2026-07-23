import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type ShortLink = Tables<"short_links">;

export interface CreateShortLinkInput {
  slug?: string; // Optional - auto-generates if not provided
  destination_url?: string; // Free URL
  link_id?: string; // Or select an existing link
}

// Generate a base62 slug
const generateBase62Slug = (length: number = 8): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => chars[byte % chars.length])
    .join("");
};

// Validate slug format
export const isValidSlug = (slug: string): boolean => {
  // 3-20 characters, alphanumeric and hyphen only
  return /^[a-zA-Z0-9-]{3,20}$/.test(slug);
};

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export function useShortLinks() {
  const { pageId } = useActivePage();
  const { links } = useLinks();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's short links
  const { data: shortLinks = [], isLoading } = useQuery({
    queryKey: ["short-links", pageId],
    queryFn: async () => {
      if (!pageId) return [];
      const { data, error } = await supabase
        .from("short_links")
        .select("*")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId,
  });

  // Count clicks per short link
  const { data: clickCounts = {} } = useQuery({
    queryKey: ["short-link-clicks", shortLinks.map((sl) => sl.id)],
    queryFn: async () => {
      if (shortLinks.length === 0) return {};
      
      const shortLinkIds = shortLinks.map((sl) => sl.id);
      const { data, error } = await supabase
        .from("link_clicks")
        .select("short_link_id")
        .in("short_link_id", shortLinkIds);

      if (error) {
        console.error("Error fetching click counts:", error);
        return {};
      }

      const counts: Record<string, number> = {};
      data?.forEach((c) => {
        if (c.short_link_id) {
          counts[c.short_link_id] = (counts[c.short_link_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: shortLinks.length > 0,
  });

  // Generate unique slug (checks for collisions)
  const generateUniqueSlug = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const slug = generateBase62Slug(8);

      // Check if slug already exists
      const { data } = await supabase
        .from("short_links")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!data) {
        return slug;
      }
      attempts++;
    }

    // Fallback: add timestamp suffix
    return generateBase62Slug(6) + Date.now().toString(36).slice(-2);
  };

  // Create short link mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateShortLinkInput) => {
      if (!pageId) throw new Error("Página não encontrada");

      // Generate slug if not provided
      const slug = input.slug || (await generateUniqueSlug());

      // Validate slug format
      if (!isValidSlug(slug)) {
        throw new Error("Slug inválido. Use 3-20 caracteres alfanuméricos ou hífen.");
      }

      // Determine destination URL
      let destination_url = input.destination_url;
      if (input.link_id) {
        const link = links.find((l) => l.id === input.link_id);
        if (link) {
          destination_url = link.url;
        }
      }

      if (!destination_url) {
        throw new Error("URL de destino obrigatória");
      }

      // Validate URL
      if (!isValidUrl(destination_url)) {
        throw new Error("URL inválida. Use http:// ou https://");
      }

      const { error } = await supabase.from("short_links").insert({
        page_id: pageId,
        slug,
        destination_url,
        link_id: input.link_id || null,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este slug já está em uso");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["short-links", pageId] });
      toast({ title: "Link curto criado!" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar link",
        description: error.message,
      });
    },
  });

  // Delete short link mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("short_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["short-links", pageId] });
      toast({ title: "Link curto excluído" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    },
  });

  // Copy link to clipboard
  const copyToClipboard = async (slug: string) => {
    const fullUrl = `${window.location.origin}/l/${slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({ title: "Link copiado!" });
    } catch {
      toast({ variant: "destructive", title: "Erro ao copiar" });
    }
  };

  return {
    shortLinks,
    clickCounts,
    isLoading,
    links, // Available links for selector
    createShortLink: createMutation.mutate,
    deleteShortLink: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    generateUniqueSlug,
    copyToClipboard,
    baseUrl: `${window.location.origin}/l/`,
  };
}
