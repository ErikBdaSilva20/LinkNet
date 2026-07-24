import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";
import { IconSelector, DynamicIcon } from "@/components/IconSelector";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Sparkles, Loader2, CalendarIcon } from "lucide-react";
import type { Enums } from "@/lib/data/types.gen";
import type { UseLinkFormReturn } from "@/hooks/useLinkForm";

type ThumbnailType = Enums<"thumbnail_type">;

interface LinkFormCardProps {
  form: UseLinkFormReturn;
}

/**
 * UI do formulário de criar/editar link (título, URL/página-alvo, thumbnail, agendamento) +
 * diálogo do seletor de ícone. Extraído de LinksScreen.tsx — toda a lógica/estado vem de
 * useLinkForm(), este componente só desenha.
 */
export function LinkFormCard({ form }: LinkFormCardProps) {
  const { formData, setFormData, editingLink, scheduleError, isSubmitting } = form;

  return (
    <>
      <GlassCard className="p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {editingLink
              ? (formData.linkType === "header" ? "Editar Cabeçalho" : formData.isPageLink ? "Editar Botão de Página" : "Editar Botão")
              : (formData.linkType === "header" ? "Adicionar Cabeçalho" : formData.isPageLink ? "Adicionar Botão de Página" : "Adicionar Novo Botão")}
          </h3>
          <Button variant="ghost" size="icon" onClick={form.resetForm}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {formData.linkType === "header" && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 Cabeçalhos são separadores visuais para organizar seus botões em seções.
            </div>
          )}
          {formData.isPageLink && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              📄 Este botão vai direcionar os visitantes para outra página sua.
            </div>
          )}

          {/* Title & URL/Page Selector */}
          <div className={cn("grid gap-4", formData.linkType !== "header" && "sm:grid-cols-2")}>
            <div className="space-y-2">
              <Label htmlFor="title">{formData.linkType === "header" ? "Texto do cabeçalho *" : "Título *"}</Label>
              <Input
                id="title"
                placeholder={formData.linkType === "header" ? "Ex: Minhas Redes Sociais" : formData.isPageLink ? "Ex: Veja meu portfólio" : "Ex: Meu Instagram"}
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="input-styled"
              />
            </div>
            {formData.linkType !== "header" && !formData.isPageLink && (
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    placeholder="https://instagram.com/..."
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    className="input-styled flex-1"
                  />
                  {form.hasUtmTemplate && formData.url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={form.handleApplyUtm}
                      className="shrink-0"
                      title="Aplicar parâmetros UTM configurados"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Aplicar UTM
                    </Button>
                  )}
                </div>
                {form.hasUtmTemplate && (
                  <p className="text-xs text-muted-foreground">
                    Template UTM disponível. Clique em "Aplicar UTM" para adicionar os parâmetros.
                  </p>
                )}
              </div>
            )}
            {formData.isPageLink && (
              <div className="space-y-2">
                <Label>Página de destino *</Label>
                <Select
                  value={formData.targetPageId || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, targetPageId: value }))}
                >
                  <SelectTrigger className="input-styled">
                    <SelectValue placeholder="Selecione uma página" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.pages
                      .filter((p) => p.id !== form.currentPageId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title || p.handle}
                        </SelectItem>
                      ))}
                    {form.pages.filter((p) => p.id !== form.currentPageId).length === 0 && (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Nenhuma outra página disponível. Crie uma nova página primeiro.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Thumbnail Type - Hidden for headers */}
          {formData.linkType !== "header" && (
            <>
              <div className="space-y-3">
                <Label>Thumbnail</Label>
                <RadioGroup
                  value={formData.thumbnailType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, thumbnailType: value as ThumbnailType }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="thumb-none" />
                    <Label htmlFor="thumb-none" className="font-normal cursor-pointer">Nenhuma</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upload" id="thumb-upload" />
                    <Label htmlFor="thumb-upload" className="font-normal cursor-pointer">Upload</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="icon" id="thumb-icon" />
                    <Label htmlFor="thumb-icon" className="font-normal cursor-pointer">Ícone</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.thumbnailType === "upload" && (
                <div className="max-w-xs">
                  <FileUpload
                    onUpload={form.handleThumbnailUpload}
                    currentUrl={formData.thumbnailUrl}
                    onRemove={() => setFormData((prev) => ({ ...prev, thumbnailUrl: null }))}
                    label=""
                  />
                </div>
              )}

              {formData.thumbnailType === "icon" && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => form.setShowIconSelector(true)}
                    className="gap-2"
                  >
                    {formData.iconName ? (
                      <>
                        <DynamicIcon name={formData.iconName} className="h-4 w-4" />
                        <span>{formData.iconName}</span>
                      </>
                    ) : formData.customIconUrl ? (
                      <>
                        <img src={formData.customIconUrl} alt="Custom icon" className="h-4 w-4 object-contain" />
                        <span>Ícone customizado</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Escolher ícone
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Schedule Section - Hidden for headers */}
          {formData.linkType !== "header" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="schedule-enabled"
                  checked={formData.scheduleEnabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      scheduleEnabled: checked,
                      startsAt: checked ? prev.startsAt : null,
                      endsAt: checked ? prev.endsAt : null,
                    }))
                  }
                />
                <Label htmlFor="schedule-enabled" className="cursor-pointer">Agendar exibição</Label>
              </div>

              <Collapsible open={formData.scheduleEnabled}>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.startsAt && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startsAt ? format(formData.startsAt, "PPP", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.startsAt ?? undefined}
                            onSelect={(date) => setFormData((prev) => ({ ...prev, startsAt: date ?? null }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.endsAt && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endsAt ? format(formData.endsAt, "PPP", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.endsAt ?? undefined}
                            onSelect={(date) => setFormData((prev) => ({ ...prev, endsAt: date ?? null }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {scheduleError && <p className="text-sm text-destructive">{scheduleError}</p>}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={form.handleSubmit}
              disabled={
                !formData.title ||
                (formData.linkType === "link" && !formData.isPageLink && !formData.url) ||
                (formData.isPageLink && !formData.targetPageId) ||
                isSubmitting
              }
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingLink ? "Salvar" : "Adicionar"}
            </Button>
            <Button variant="outline" onClick={form.resetForm} className="rounded-xl border-border/50">
              Cancelar
            </Button>
          </div>
        </div>
      </GlassCard>

      <IconSelector
        open={form.showIconSelector}
        onOpenChange={form.setShowIconSelector}
        selectedIcon={formData.iconName}
        customIconUrl={formData.customIconUrl}
        onSelectLibraryIcon={form.onSelectLibraryIcon}
        onSelectCustomIcon={form.onSelectCustomIcon}
        onUploadIcon={form.handleIconUpload}
      />
    </>
  );
}
