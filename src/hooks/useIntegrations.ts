import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "@/hooks/use-toast";

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

export interface IntegrationsData {
  id: string;
  page_id: string;
  google_analytics_measurement_id: string | null;
  meta_pixel_id: string | null;
  custom_head_html: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  updated_at: string;
}

export interface IntegrationsUpdateInput {
  google_analytics_measurement_id?: string | null;
  meta_pixel_id?: string | null;
  custom_head_html?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export function useIntegrations() {
  const { pageId } = useActivePage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch integrations
  const {
    data: integrations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["integrations", pageId],
    queryFn: async () => {
      if (!pageId) return null;

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();

      if (error) throw error;
      return data as IntegrationsData | null;
    },
    enabled: !!pageId,
  });

  // Save integrations mutation (upsert)
  const saveMutation = useMutation({
    mutationFn: async (updates: IntegrationsUpdateInput) => {
      if (!pageId) throw new Error("Página não encontrada");

      // Clean up empty strings to null
      const cleanedUpdates: IntegrationsUpdateInput = {
        google_analytics_measurement_id: updates.google_analytics_measurement_id?.trim() || null,
        meta_pixel_id: updates.meta_pixel_id?.trim() || null,
        custom_head_html: updates.custom_head_html?.trim() || null,
        utm_source: updates.utm_source?.trim() || null,
        utm_medium: updates.utm_medium?.trim() || null,
        utm_campaign: updates.utm_campaign?.trim() || null,
      };

      // Validate GA ID if provided
      if (cleanedUpdates.google_analytics_measurement_id && 
          !isValidGaId(cleanedUpdates.google_analytics_measurement_id)) {
        throw new Error("ID do Google Analytics inválido");
      }

      // Validate Pixel ID if provided
      if (cleanedUpdates.meta_pixel_id && 
          !isValidPixelId(cleanedUpdates.meta_pixel_id)) {
        throw new Error("ID do Meta Pixel inválido");
      }

      if (integrations?.id) {
        // Update existing record
        const { error } = await supabase
          .from("integrations")
          .update(cleanedUpdates)
          .eq("id", integrations.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("integrations")
          .insert({
            page_id: pageId,
            ...cleanedUpdates,
          });

        if (error) throw error;
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
      // If URL is invalid, return original
      return url;
    }
  };

  // Check if UTM template is configured
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
