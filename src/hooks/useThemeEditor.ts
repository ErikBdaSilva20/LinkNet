import { useCallback, useEffect, useState } from "react";
import { useTheme, type ThemeUpdateInput } from "./useTheme";
import { getCuratedThemeById } from "@/data/curatedThemes";
import type { Database } from "@/lib/data/types.gen";

type BackgroundType = Database["public"]["Enums"]["background_type"];

/**
 * Estado local do editor de tema (live-preview antes de salvar) + sincronização com o tema
 * carregado + save. Extraído de DesignScreen.tsx (era 544 linhas; a tela em si é 5 seções
 * simples de UI — o que pesava era este estado, ver
 * docs/auditoria-refactor/01-codigo-gaps-dead-code-refactor.md).
 */
export function useThemeEditor() {
  const { theme, isLoading, saveTheme, isSaving, uploadBackground } = useTheme();

  const [selectedThemeId, setSelectedThemeId] = useState<string>("custom");
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("gradient");
  const [backgroundValue, setBackgroundValue] = useState("#0f172a");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#22d3ee");
  const [fontFamily, setFontFamily] = useState("inter");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [buttonRadius, setButtonRadius] = useState(16);

  useEffect(() => {
    if (theme) {
      setSelectedThemeId(theme.theme_id || "custom");
      setBackgroundType(theme.background_type || "gradient");
      setBackgroundValue(theme.background_value || "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)");
      setBackgroundImageUrl(theme.custom_background_url);
      setTextColor(theme.text_color || "#ffffff");
      setAccentColor(theme.accent_color || "#22d3ee");
      setFontFamily(theme.font_family || "inter");
      setButtonStyle(theme.button_style || "rounded");
      setButtonRadius(theme.button_radius || 16);
    }
  }, [theme]);

  const applyCuratedTheme = useCallback((themeId: string) => {
    setSelectedThemeId(themeId);

    const curatedTheme = getCuratedThemeById(themeId);
    if (curatedTheme?.settings) {
      setBackgroundType(curatedTheme.settings.background_type);
      setBackgroundValue(curatedTheme.settings.background_value);
      setBackgroundImageUrl(null);
      setTextColor(curatedTheme.settings.text_color);
      setAccentColor(curatedTheme.settings.accent_color);
      setFontFamily(curatedTheme.settings.font_family);
      setButtonStyle(curatedTheme.settings.button_style);
      setButtonRadius(curatedTheme.settings.button_radius);
    }
  }, []);

  const setCustomBackgroundType = useCallback((type: BackgroundType) => {
    setBackgroundType(type);
    setSelectedThemeId("custom");
  }, []);

  const setCustomBackgroundValue = useCallback((value: string) => {
    setBackgroundValue(value);
    setSelectedThemeId("custom");
  }, []);

  const setCustomTextColor = useCallback((value: string) => {
    setTextColor(value);
    setSelectedThemeId("custom");
  }, []);

  const setCustomAccentColor = useCallback((value: string) => {
    setAccentColor(value);
    setSelectedThemeId("custom");
  }, []);

  const setCustomFontFamily = useCallback((value: string) => {
    setFontFamily(value);
    setSelectedThemeId("custom");
  }, []);

  const setCustomButtonStyle = useCallback((value: string) => {
    setButtonStyle(value);
    if (value === "pill") setButtonRadius(999);
    else if (value === "square") setButtonRadius(4);
    else setButtonRadius(16);
    setSelectedThemeId("custom");
  }, []);

  const setCustomButtonRadius = useCallback((value: number) => {
    setButtonRadius(value);
    setSelectedThemeId("custom");
  }, []);

  const handleBackgroundUpload = useCallback(async (file: File): Promise<string | null> => {
    const url = await uploadBackground(file);
    if (url) {
      setBackgroundImageUrl(url);
      setBackgroundType("image");
      setSelectedThemeId("custom");
    }
    return url;
  }, [uploadBackground]);

  const handleSave = useCallback(() => {
    const updates: ThemeUpdateInput = {
      theme_id: selectedThemeId,
      background_type: backgroundType,
      background_value: backgroundType !== "image" ? backgroundValue : null,
      custom_background_url: backgroundType === "image" ? backgroundImageUrl : null,
      text_color: textColor,
      accent_color: accentColor,
      font_family: fontFamily,
      button_style: buttonStyle,
      button_radius: buttonRadius,
    };
    saveTheme(updates);
  }, [
    selectedThemeId, backgroundType, backgroundValue, backgroundImageUrl,
    textColor, accentColor, fontFamily, buttonStyle, buttonRadius, saveTheme,
  ]);

  const hasChanges = Boolean(theme && (
    theme.theme_id !== selectedThemeId ||
    theme.background_type !== backgroundType ||
    theme.background_value !== backgroundValue ||
    theme.custom_background_url !== backgroundImageUrl ||
    theme.text_color !== textColor ||
    theme.accent_color !== accentColor ||
    theme.font_family !== fontFamily ||
    theme.button_style !== buttonStyle ||
    theme.button_radius !== buttonRadius
  ));

  const previewTheme = {
    background_type: backgroundType,
    background_value: backgroundValue,
    custom_background_url: backgroundImageUrl,
    text_color: textColor,
    accent_color: accentColor,
    font_family: fontFamily,
    button_style: buttonStyle,
    button_radius: buttonRadius,
  };

  return {
    isLoading,
    isSaving,
    hasChanges,
    previewTheme,
    handleSave,
    handleBackgroundUpload,
    applyCuratedTheme,

    selectedThemeId,
    setSelectedThemeId,
    backgroundType,
    setBackgroundType: setCustomBackgroundType,
    backgroundValue,
    setBackgroundValue: setCustomBackgroundValue,
    backgroundImageUrl,
    textColor,
    setTextColor: setCustomTextColor,
    accentColor,
    setAccentColor: setCustomAccentColor,
    fontFamily,
    setFontFamily: setCustomFontFamily,
    buttonStyle,
    setButtonStyle: setCustomButtonStyle,
    buttonRadius,
    setButtonRadius: setCustomButtonRadius,
  };
}

export type UseThemeEditorReturn = ReturnType<typeof useThemeEditor>;
