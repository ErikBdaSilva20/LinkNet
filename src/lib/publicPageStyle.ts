import type { CSSProperties } from "react";
import type { Database } from "@/lib/data/types.gen";

type BackgroundType = Database["public"]["Enums"]["background_type"];

interface ThemeBackground {
  background_type: BackgroundType;
  background_value: string | null;
  custom_background_url: string | null;
}

interface GetBackgroundStyleOptions {
  // A página pública real usa "fixed" (fundo não rola com o conteúdo); o preview de
  // celular fica dentro de um frame pequeno com scroll próprio, onde "fixed" atrapalharia.
  fixedAttachment?: boolean;
}

/**
 * Estilo de fundo derivado do tema — extraído de PublicProfileScreen.tsx e MobilePreview.tsx,
 * que reimplementavam essa mesma regra cada um do seu jeito (ver
 * docs/auditoria-refactor/01-codigo-gaps-dead-code-refactor.md, duplicação semântica).
 */
export function getBackgroundStyle(
  theme: ThemeBackground,
  { fixedAttachment = false }: GetBackgroundStyleOptions = {}
): CSSProperties {
  if (theme.background_type === "image" && theme.custom_background_url) {
    return {
      backgroundImage: `url(${theme.custom_background_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      ...(fixedAttachment ? { backgroundAttachment: "fixed" } : {}),
    };
  }
  if (theme.background_type === "gradient" && theme.background_value) {
    return { background: theme.background_value };
  }
  return { backgroundColor: theme.background_value || "#0f172a" };
}

/**
 * Estilo do "botão" de um link normal (não-header) na página pública / preview: borda e
 * fundo derivados da cor de destaque do tema, radius do estilo de botão escolhido.
 */
export function getLinkButtonStyle(accentColor: string, buttonRadius: string): CSSProperties {
  return {
    borderRadius: buttonRadius,
    borderColor: `${accentColor}40`,
    backgroundColor: `${accentColor}15`,
  };
}
