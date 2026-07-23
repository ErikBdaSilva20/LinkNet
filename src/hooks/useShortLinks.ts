import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/use-toast";
import {
  listShortLinks,
  createShortLink as createShortLinkRepo,
  removeShortLink,
  type ShortLink,
} from "@/lib/data/short_links.repo";
import { listLinkClicks } from "@/lib/data/link_clicks.repo";
import { ApiError } from "@/lib/data/client";

export type { ShortLink };

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

  // list-then-filter: modo genérico não tem filtro server-side (§B5)
  const { data: shortLinks = [], isLoading } = useQuery({
    queryKey: ["short-links", pageId],
    queryFn: async (): Promise<ShortLink[]> => {
      if (!pageId) return [];
      const all = await listShortLinks();
      return all
        .filter((sl) => sl.page_id === pageId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    enabled: !!pageId,
  });

  const { data: clickCounts = {} } = useQuery({
    queryKey: ["short-link-clicks", shortLinks.map((sl) => sl.id)],
    queryFn: async (): Promise<Record<string, number>> => {
      if (shortLinks.length === 0) return {};

      const shortLinkIds = new Set(shortLinks.map((sl) => sl.id));
      const allClicks = await listLinkClicks();

      const counts: Record<string, number> = {};
      allClicks
        .filter((c) => c.short_link_id && shortLinkIds.has(c.short_link_id))
        .forEach((c) => {
          counts[c.short_link_id!] = (counts[c.short_link_id!] || 0) + 1;
        });
      return counts;
    },
    enabled: shortLinks.length > 0,
  });

  // Gera um slug e confia na unique constraint do banco pra pegar colisão real (o modo
  // genérico só devolve os short_links do próprio dono — não dá pra checar colisão global
  // com outro usuário do mesmo tenant por list(); risco residual é desprezível: slug é
  // base62 de 8 chars aleatório).
  const generateUniqueSlug = async (): Promise<string> => {
    const ownSlugs = new Set(shortLinks.map((sl) => sl.slug));
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const slug = generateBase62Slug(8);
      if (!ownSlugs.has(slug)) return slug;
      attempts++;
    }

    return generateBase62Slug(6) + Date.now().toString(36).slice(-2);
  };

  const createMutation = useMutation({
    mutationFn: async (input: CreateShortLinkInput) => {
      if (!pageId) throw new Error("Página não encontrada");

      const slug = input.slug || (await generateUniqueSlug());

      if (!isValidSlug(slug)) {
        throw new Error("Slug inválido. Use 3-20 caracteres alfanuméricos ou hífen.");
      }

      let destination_url = input.destination_url;
      if (input.link_id) {
        const link = links.find((l) => l.id === input.link_id);
        if (link?.url) {
          destination_url = link.url;
        }
      }

      if (!destination_url) {
        throw new Error("URL de destino obrigatória");
      }

      if (!isValidUrl(destination_url)) {
        throw new Error("URL inválida. Use http:// ou https://");
      }

      try {
        await createShortLinkRepo({
          page_id: pageId,
          slug,
          destination_url,
          link_id: input.link_id || null,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await removeShortLink(id);
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
