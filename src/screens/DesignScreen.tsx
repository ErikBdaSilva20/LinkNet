import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobilePreview } from "@/components/MobilePreview";
import { FileUpload } from "@/components/FileUpload";
import { DesignSidebar, type DesignSection } from "@/components/design/DesignSidebar";
import { ThemeGallery } from "@/components/design/ThemeGallery";
import { getCuratedThemeById, getCuratedThemes } from "@/data/curatedThemes";
import { 
  useTheme, 
  FONT_OPTIONS, 
  BUTTON_STYLES, 
  GRADIENT_PRESETS,
  type ThemeUpdateInput 
} from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { useLinks } from "@/hooks/useLinks";
import { cn } from "@/lib/utils";
import { 
  Check, 
  Palette, 
  Type, 
  Square, 
  Loader2,
  Save,
  ImageIcon,
  Blend,
} from "lucide-react";
import type { Database } from "@/lib/data/types.gen";

type BackgroundType = Database["public"]["Enums"]["background_type"];

export default function DesignScreen() {
  const { theme, isLoading, saveTheme, isSaving, uploadBackground } = useTheme();
  const { profile } = useProfile();
  const { links } = useLinks();

  // Section navigation
  const [activeSection, setActiveSection] = useState<DesignSection>("theme");
  
  // Local state for live preview
  const [selectedThemeId, setSelectedThemeId] = useState<string>("custom");
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("gradient");
  const [backgroundValue, setBackgroundValue] = useState("#0f172a");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#22d3ee");
  const [fontFamily, setFontFamily] = useState("inter");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [buttonRadius, setButtonRadius] = useState(16);

  // Sync local state with loaded theme
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

  // Apply curated theme
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

  // Handle background image upload
  const handleBackgroundUpload = useCallback(async (file: File): Promise<string | null> => {
    const url = await uploadBackground(file);
    if (url) {
      setBackgroundImageUrl(url);
      setBackgroundType("image");
      setSelectedThemeId("custom");
    }
    return url;
  }, [uploadBackground]);

  // Save theme
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
    textColor, accentColor, fontFamily, buttonStyle, buttonRadius, saveTheme
  ]);

  // Check if there are unsaved changes
  const hasChanges = theme && (
    theme.theme_id !== selectedThemeId ||
    theme.background_type !== backgroundType ||
    theme.background_value !== backgroundValue ||
    theme.custom_background_url !== backgroundImageUrl ||
    theme.text_color !== textColor ||
    theme.accent_color !== accentColor ||
    theme.font_family !== fontFamily ||
    theme.button_style !== buttonStyle ||
    theme.button_radius !== buttonRadius
  );

  // Preview data
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Design</h1>
            <p className="text-muted-foreground mt-1">
              Personalize a aparência da sua página pública
            </p>
          </div>
          
          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="gradient-primary text-primary-foreground rounded-xl"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>

        {/* 3-Column Layout */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <DesignSidebar 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Theme Section */}
            {activeSection === "theme" && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Escolha um Tema
                </h2>
                
                <Tabs defaultValue="curated" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="curated">Temas Prontos</TabsTrigger>
                    <TabsTrigger value="customizable">Personalizar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="curated">
                    <ThemeGallery 
                      themes={getCuratedThemes()}
                      selectedThemeId={selectedThemeId}
                      onSelectTheme={applyCuratedTheme}
                    />
                  </TabsContent>
                  
                  <TabsContent value="customizable">
                    <div 
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedThemeId === "custom"
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border"
                      )}
                      onClick={() => setSelectedThemeId("custom")}
                    >
                      <p className="text-sm text-muted-foreground">
                        Personalize cada detalhe do seu tema usando as opções na barra lateral: Fundo, Texto, Botões e Cores.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </GlassCard>
            )}

            {/* Wallpaper Section */}
            {activeSection === "wallpaper" && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Palette className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Fundo
                  </h2>
                </div>

                {/* Background Type */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button
                    variant={backgroundType === "color" ? "default" : "outline"}
                    onClick={() => {
                      setBackgroundType("color");
                      setSelectedThemeId("custom");
                    }}
                    className="gap-2"
                  >
                    <Palette className="h-4 w-4" />
                    Cor
                  </Button>
                  <Button
                    variant={backgroundType === "gradient" ? "default" : "outline"}
                    onClick={() => {
                      setBackgroundType("gradient");
                      setSelectedThemeId("custom");
                    }}
                    className="gap-2"
                  >
                    <Blend className="h-4 w-4" />
                    Gradient
                  </Button>
                  <Button
                    variant={backgroundType === "image" ? "default" : "outline"}
                    onClick={() => {
                      setBackgroundType("image");
                      setSelectedThemeId("custom");
                    }}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Imagem
                  </Button>
                </div>

                {/* Color Picker */}
                {backgroundType === "color" && (
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={backgroundValue.startsWith("linear") ? "#000000" : backgroundValue}
                      onChange={(e) => {
                        setBackgroundValue(e.target.value);
                        setSelectedThemeId("custom");
                      }}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <Input
                      value={backgroundValue.startsWith("linear") ? "#000000" : backgroundValue}
                      onChange={(e) => {
                        setBackgroundValue(e.target.value);
                        setSelectedThemeId("custom");
                      }}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                )}

                {/* Gradient Picker */}
                {backgroundType === "gradient" && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {GRADIENT_PRESETS.map((gradient) => (
                      <button
                        key={gradient.name}
                        onClick={() => {
                          setBackgroundValue(gradient.value);
                          setSelectedThemeId("custom");
                        }}
                        className={cn(
                          "w-full h-12 rounded-lg border-2 transition-all",
                          backgroundValue === gradient.value
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent hover:border-border"
                        )}
                        style={{ background: gradient.value }}
                        title={gradient.name}
                      />
                    ))}
                  </div>
                )}

                {/* Image Upload */}
                {backgroundType === "image" && (
                  <FileUpload
                    onUpload={handleBackgroundUpload}
                    accept="image/*"
                    maxSizeMB={5}
                    currentUrl={backgroundImageUrl}
                  />
                )}
              </GlassCard>
            )}

            {/* Text Section */}
            {activeSection === "text" && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Type className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Tipografia
                  </h2>
                </div>

                <div className="space-y-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => {
                        setFontFamily(font.id);
                        setSelectedThemeId("custom");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
                        fontFamily === font.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <span
                        className="text-lg text-foreground"
                        style={{ fontFamily: font.family }}
                      >
                        {font.name}
                      </span>
                      {fontFamily === font.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Buttons Section */}
            {activeSection === "buttons" && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Square className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Estilo de Botão
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {BUTTON_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setButtonStyle(style.id);
                        if (style.id === "pill") setButtonRadius(999);
                        else if (style.id === "square") setButtonRadius(4);
                        else setButtonRadius(16);
                        setSelectedThemeId("custom");
                      }}
                      className={cn(
                        "relative p-4 rounded-xl border-2 text-center transition-all duration-200",
                        buttonStyle === style.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <div
                        className="w-full h-8 mb-2"
                        style={{
                          backgroundColor: accentColor,
                          borderRadius:
                            style.id === "pill"
                              ? "999px"
                              : style.id === "square"
                              ? "4px"
                              : "12px",
                        }}
                      />
                      <p className="text-sm font-medium text-foreground">
                        {style.name}
                      </p>
                      {buttonStyle === style.id && (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Radius Slider (only for rounded) */}
                {buttonStyle === "rounded" && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Raio da borda</Label>
                      <span className="text-sm text-muted-foreground">
                        {buttonRadius}px
                      </span>
                    </div>
                    <Slider
                      value={[buttonRadius]}
                      onValueChange={([value]) => {
                        setButtonRadius(value);
                        setSelectedThemeId("custom");
                      }}
                      min={0}
                      max={32}
                      step={1}
                    />
                  </div>
                )}
              </GlassCard>
            )}

            {/* Colors Section */}
            {activeSection === "colors" && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Palette className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Cores
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor do texto</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => {
                          setTextColor(e.target.value);
                          setSelectedThemeId("custom");
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => {
                          setTextColor(e.target.value);
                          setSelectedThemeId("custom");
                        }}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor de destaque</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          setSelectedThemeId("custom");
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          setSelectedThemeId("custom");
                        }}
                        placeholder="#22d3ee"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Header Section (placeholder) */}
            {activeSection === "header" && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Cabeçalho
                </h2>
                <p className="text-muted-foreground">
                  Configure seu avatar e informações do perfil na página de{" "}
                  <a href="/app/settings" className="text-primary hover:underline">
                    Configurações
                  </a>.
                </p>
              </GlassCard>
            )}
          </div>

          {/* Preview */}
          <div className="w-[320px] shrink-0">
            <div className="sticky top-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                  Preview
                </h3>
                <MobilePreview
                  theme={previewTheme}
                  profile={profile}
                  links={links?.map(l => ({ id: l.id, title: l.title })) || []}
                />
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
  );
}
