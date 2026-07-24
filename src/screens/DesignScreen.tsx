import { useState } from "react";
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
import { getCuratedThemes } from "@/data/curatedThemes";
import { FONT_OPTIONS, BUTTON_STYLES, GRADIENT_PRESETS } from "@/hooks/useTheme";
import { useThemeEditor } from "@/hooks/useThemeEditor";
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

export default function DesignScreen() {
  const editor = useThemeEditor();
  const { profile } = useProfile();
  const { links } = useLinks();

  const [activeSection, setActiveSection] = useState<DesignSection>("theme");

  if (editor.isLoading) {
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

        <Button
          onClick={editor.handleSave}
          disabled={editor.isSaving || !editor.hasChanges}
          className="gradient-primary text-primary-foreground rounded-xl"
        >
          {editor.isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      {/* 3-Column Layout */}
      <div className="flex gap-6">
        <DesignSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <div className="flex-1 min-w-0">
          {/* Theme Section */}
          {activeSection === "theme" && (
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Escolha um Tema</h2>

              <Tabs defaultValue="curated" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="curated">Temas Prontos</TabsTrigger>
                  <TabsTrigger value="customizable">Personalizar</TabsTrigger>
                </TabsList>

                <TabsContent value="curated">
                  <ThemeGallery
                    themes={getCuratedThemes()}
                    selectedThemeId={editor.selectedThemeId}
                    onSelectTheme={editor.applyCuratedTheme}
                  />
                </TabsContent>

                <TabsContent value="customizable">
                  <div
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      editor.selectedThemeId === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    )}
                    onClick={() => editor.setSelectedThemeId("custom")}
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
                <h2 className="text-xl font-semibold text-foreground">Fundo</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button
                  variant={editor.backgroundType === "color" ? "default" : "outline"}
                  onClick={() => editor.setBackgroundType("color")}
                  className="gap-2"
                >
                  <Palette className="h-4 w-4" />
                  Cor
                </Button>
                <Button
                  variant={editor.backgroundType === "gradient" ? "default" : "outline"}
                  onClick={() => editor.setBackgroundType("gradient")}
                  className="gap-2"
                >
                  <Blend className="h-4 w-4" />
                  Gradient
                </Button>
                <Button
                  variant={editor.backgroundType === "image" ? "default" : "outline"}
                  onClick={() => editor.setBackgroundType("image")}
                  className="gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Imagem
                </Button>
              </div>

              {editor.backgroundType === "color" && (
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={editor.backgroundValue.startsWith("linear") ? "#000000" : editor.backgroundValue}
                    onChange={(e) => editor.setBackgroundValue(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <Input
                    value={editor.backgroundValue.startsWith("linear") ? "#000000" : editor.backgroundValue}
                    onChange={(e) => editor.setBackgroundValue(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              )}

              {editor.backgroundType === "gradient" && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {GRADIENT_PRESETS.map((gradient) => (
                    <button
                      key={gradient.name}
                      onClick={() => editor.setBackgroundValue(gradient.value)}
                      className={cn(
                        "w-full h-12 rounded-lg border-2 transition-all",
                        editor.backgroundValue === gradient.value
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-border"
                      )}
                      style={{ background: gradient.value }}
                      title={gradient.name}
                    />
                  ))}
                </div>
              )}

              {editor.backgroundType === "image" && (
                <FileUpload
                  onUpload={editor.handleBackgroundUpload}
                  accept="image/*"
                  maxSizeMB={5}
                  currentUrl={editor.backgroundImageUrl}
                />
              )}
            </GlassCard>
          )}

          {/* Text Section */}
          {activeSection === "text" && (
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Type className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Tipografia</h2>
              </div>

              <div className="space-y-2">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => editor.setFontFamily(font.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
                      editor.fontFamily === font.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <span className="text-lg text-foreground" style={{ fontFamily: font.family }}>
                      {font.name}
                    </span>
                    {editor.fontFamily === font.id && <Check className="h-4 w-4 text-primary" />}
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
                <h2 className="text-xl font-semibold text-foreground">Estilo de Botão</h2>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {BUTTON_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => editor.setButtonStyle(style.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-center transition-all duration-200",
                      editor.buttonStyle === style.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <div
                      className="w-full h-8 mb-2"
                      style={{
                        backgroundColor: editor.accentColor,
                        borderRadius:
                          style.id === "pill" ? "999px" : style.id === "square" ? "4px" : "12px",
                      }}
                    />
                    <p className="text-sm font-medium text-foreground">{style.name}</p>
                    {editor.buttonStyle === style.id && (
                      <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {editor.buttonStyle === "rounded" && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Raio da borda</Label>
                    <span className="text-sm text-muted-foreground">{editor.buttonRadius}px</span>
                  </div>
                  <Slider
                    value={[editor.buttonRadius]}
                    onValueChange={([value]) => editor.setButtonRadius(value)}
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
                <h2 className="text-xl font-semibold text-foreground">Cores</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor do texto</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editor.textColor}
                      onChange={(e) => editor.setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <Input
                      value={editor.textColor}
                      onChange={(e) => editor.setTextColor(e.target.value)}
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
                      value={editor.accentColor}
                      onChange={(e) => editor.setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <Input
                      value={editor.accentColor}
                      onChange={(e) => editor.setAccentColor(e.target.value)}
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
              <h2 className="text-xl font-semibold text-foreground mb-4">Cabeçalho</h2>
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
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Preview</h3>
              <MobilePreview
                theme={editor.previewTheme}
                profile={profile}
                links={links?.map((l) => ({ id: l.id, title: l.title })) || []}
              />
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
