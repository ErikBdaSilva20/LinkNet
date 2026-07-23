import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "@/hooks/use-toast";
import {
  listIntegrations,
  createIntegration,
  updateIntegration,
  type Integration,
} from "@/lib/data/integrations.repo";

// Validation regex patterns
export const GA_REGEX = /^G-[A-Z0-9]{6,}$/;
export const PIXEL_REGEX = /^\d{15,16}$/;

// Validation functions
export const isValidGaId = (id: string): boolean => {
  if (!id.trim()) return true; // Empty is valid (optional)
  return GA_REGEX.test(id);
};

export const isValidPixelId = (id: string): boolean => {
  if (!id.trim()) return true;
  return PIXEL_REGEX.test(id);
};

export type IntegrationsData = Integration;

export interface IntegrationsUpdateInput {
  google_analytics_measurement_id?: string | null;
  meta_pixel_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export function useIntegrations() {
  const { pageId } = useActivePage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // list-then-find: modo genérico não tem filtro server-side (§B5)
  const {
    data: integrations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["integrations", pageId],
    queryFn: async (): Promise<Integration | null> => {
      if (!pageId) return null;
      const all = await listIntegrations();
      return all.find((i) => i.page_id === pageId) ?? null;
    },
    enabled: !!pageId,
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: IntegrationsUpdateInput) => {
      if (!pageId) throw new Error("Página não encontrada");

      const cleanedUpdates: IntegrationsUpdateInput = {
        google_analytics_measurement_id: updates.google_analytics_measurement_id?.trim() || null,
        meta_pixel_id: updates.meta_pixel_id?.trim() || null,
        utm_source: updates.utm_source?.trim() || null,
        utm_medium: updates.utm_medium?.trim() || null,
        utm_campaign: updates.utm_campaign?.trim() || null,
      };

      if (
        cleanedUpdates.google_analytics_measurement_id &&
        !isValidGaId(cleanedUpdates.google_analytics_measurement_id)
      ) {
        throw new Error("ID do Google Analytics inválido");
      }

      if (cleanedUpdates.meta_pixel_id && !isValidPixelId(cleanedUpdates.meta_pixel_id)) {
        throw new Error("ID do Meta Pixel inválido");
      }

      if (integrations?.id) {
        await updateIntegration(integrations.id, cleanedUpdates);
      } else {
        await createIntegration({ page_id: pageId, ...cleanedUpdates });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", pageId] });
      toast({ title: "Tracking salvo com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar tracking",
        description: error.message,
      });
    },
  });

  // Helper: Build URL with UTM params
  const applyUtmToUrl = (url: string): string => {
    if (!integrations?.utm_source && !integrations?.utm_medium && !integrations?.utm_campaign) {
      return url;
    }

    try {
      const parsed = new URL(url);

      if (integrations.utm_source) {
        parsed.searchParams.set("utm_source", integrations.utm_source);
      }
      if (integrations.utm_medium) {
        parsed.searchParams.set("utm_medium", integrations.utm_medium);
      }
      if (integrations.utm_campaign) {
        parsed.searchParams.set("utm_campaign", integrations.utm_campaign);
      }

      return parsed.toString();
    } catch {
      return url;
    }
  };

  const hasUtmTemplate = !!(
    integrations?.utm_source ||
    integrations?.utm_medium ||
    integrations?.utm_campaign
  );

  return {
    integrations,
    isLoading,
    error,
    saveIntegrations: saveMutation.mutate,
    saveIntegrationsAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    applyUtmToUrl,
    hasUtmTemplate,
  };
}
