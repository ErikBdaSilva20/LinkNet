import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "@/hooks/use-toast";
import { listThemes, createTheme, updateTheme, type Theme } from "@/lib/data/themes.repo";
import { encodeImageToDataUrl } from "@/lib/image";
import type { Database } from "@/lib/data/types.gen";

type BackgroundType = Database["public"]["Enums"]["background_type"];

export interface ThemePreset {
  name: string;
  background_type: BackgroundType;
  background_value: string;
  text_color: string;
  accent_color: string;
  font_family: string;
  button_style: string;
  button_radius: number;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  default: {
    name: "Padrão",
    background_type: "gradient",
    background_value: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    text_color: "#ffffff",
    accent_color: "#22d3ee",
    font_family: "inter",
    button_style: "rounded",
    button_radius: 16,
  },
  dark: {
    name: "Dark",
    background_type: "color",
    background_value: "#000000",
    text_color: "#ffffff",
    accent_color: "#ffffff",
    font_family: "inter",
    button_style: "rounded",
    button_radius: 12,
  },
  pastel: {
    name: "Pastel",
    background_type: "gradient",
    background_value: "linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)",
    text_color: "#1f2937",
    accent_color: "#ec4899",
    font_family: "poppins",
    button_style: "pill",
    button_radius: 999,
  },
  neon: {
    name: "Neon",
    background_type: "color",
    background_value: "#0a0a0a",
    text_color: "#22d3ee",
    accent_color: "#a855f7",
    font_family: "inter",
    button_style: "rounded",
    button_radius: 8,
  },
  minimal: {
    name: "Minimal",
    background_type: "color",
    background_value: "#ffffff",
    text_color: "#171717",
    accent_color: "#171717",
    font_family: "inter",
    button_style: "rounded",
    button_radius: 4,
  },
  gradient: {
    name: "Gradient",
    background_type: "gradient",
    background_value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    text_color: "#ffffff",
    accent_color: "#fbbf24",
    font_family: "poppins",
    button_style: "pill",
    button_radius: 999,
  },
};

export const FONT_OPTIONS = [
  { id: "inter", name: "Inter", family: "'Inter', sans-serif" },
  { id: "poppins", name: "Poppins", family: "'Poppins', sans-serif" },
  { id: "roboto", name: "Roboto", family: "'Roboto', sans-serif" },
];

export const BUTTON_STYLES = [
  { id: "rounded", name: "Arredondado", description: "Bordas suaves" },
  { id: "pill", name: "Pílula", description: "Totalmente arredondado" },
  { id: "square", name: "Quadrado", description: "Bordas retas" },
];

export const GRADIENT_PRESETS = [
  { name: "Ocean", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Forest", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { name: "Fire", value: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)" },
  { name: "Night", value: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" },
  { name: "Dawn", value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
];

export type ThemeUpdateInput = Partial<Omit<Theme, "id" | "page_id" | "created_at" | "updated_at">>;

export function useTheme() {
  const { pageId } = useActivePage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // list-then-find: modo genérico não tem filtro server-side (§B5)
  const { data: theme, isLoading } = useQuery({
    queryKey: ["theme", pageId],
    queryFn: async (): Promise<Theme | null> => {
      if (!pageId) return null;
      const all = await listThemes();
      return all.find((t) => t.page_id === pageId) ?? null;
    },
    enabled: !!pageId,
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: ThemeUpdateInput) => {
      if (!pageId) throw new Error("Página não encontrada");

      if (theme?.id) {
        await updateTheme(theme.id, updates);
      } else {
        // Insert new theme (should rarely happen as themes are created on page creation)
        await createTheme({ page_id: pageId, ...updates });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme", pageId] });
      toast({ title: "Tema salvo com sucesso!" });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar tema",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Upload background image
  const uploadBackground = async (file: File): Promise<string | null> => {
    if (!pageId) return null;

    try {
      const dataUrl = await encodeImageToDataUrl(file, { maxDim: 1080, quality: 0.7 });

      if (theme?.id) {
        await updateTheme(theme.id, { custom_background_url: dataUrl });
      } else {
        await createTheme({ page_id: pageId, custom_background_url: dataUrl });
      }

      queryClient.invalidateQueries({ queryKey: ["theme", pageId] });
      return dataUrl;
    } catch (error) {
      toast({
        title: "Erro ao fazer upload",
        description: error instanceof Error ? error.message : "Não foi possível enviar a imagem.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    theme,
    isLoading,
    saveTheme: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    uploadBackground,
  };
}

// Helper to get font family CSS value
export function getFontFamily(fontId: string): string {
  return FONT_OPTIONS.find((f) => f.id === fontId)?.family || FONT_OPTIONS[0].family;
}

// Helper to get button radius based on style
export function getButtonRadius(style: string, customRadius: number): string {
  if (style === "pill") return "999px";
  if (style === "square") return "4px";
  return `${customRadius}px`;
}
