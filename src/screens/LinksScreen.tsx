import { GlassCard } from "@/components/GlassCard";
import { MobilePreview } from "@/components/MobilePreview";
import { useActivePage } from "@/contexts/ActivePageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";
import { IconSelector, DynamicIcon } from "@/components/IconSelector";
import { AddLinkModal } from "@/components/AddLinkModal";
import { SortableLinksList } from "@/components/SortableLinksList";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLinks, type Link, type CreateLinkInput, type UpdateLinkInput, type LinkType } from "@/hooks/useLinks";
import { encodeImageToDataUrl } from "@/lib/image";

import { useIntegrations } from "@/hooks/useIntegrations";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  ExternalLink,
  X,
  Sparkles,
  Loader2,
  CalendarIcon,
  Mail,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import type { Enums } from "@/lib/data/types.gen";
import type { LinkTemplate } from "@/data/linkTemplates";

type ThumbnailType = Enums<"thumbnail_type">;

interface LinkFormData {
  title: string;
  url: string;
  linkType: LinkType;
  isPageLink: boolean;
  targetPageId: string | null;
  thumbnailType: ThumbnailType;
  thumbnailUrl: string | null;
  iconName: string | null;
  customIconUrl: string | null;
  scheduleEnabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

const initialFormData: LinkFormData = {
  title: "",
  url: "",
  linkType: "link",
  isPageLink: false,
  targetPageId: null,
  thumbnailType: "none",
  thumbnailUrl: null,
  iconName: null,
  customIconUrl: null,
  scheduleEnabled: false,
  startsAt: null,
  endsAt: null,
};



// Validation helpers
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export default function LinksScreen() {
  const {
    links,
    isLoading,
    clickCounts,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks,
    uploadThumbnail,
    isCreating,
    isUpdating,
  } = useLinks();

  const { hasUtmTemplate, applyUtmToUrl } = useIntegrations();
  const { theme } = useTheme();
  const { profile } = useProfile();
  const { page, pages } = useActivePage();

  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState<LinkFormData>(initialFormData);
  const [showIconSelector, setShowIconSelector] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);


  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingLink(null);
    setShowForm(false);
  }, []);

  // Handler for template selection from AddLinkModal
  const handleSelectTemplate = useCallback((template: LinkTemplate) => {
    setFormData({
      ...initialFormData,
      title: template.defaultTitle || "",
      iconName: template.iconName,
      thumbnailType: template.iconName ? "icon" : "none",
    });
    setShowAddModal(false);
    setShowForm(true);
  }, []);

  // Handler for URL paste from AddLinkModal
  const handlePasteUrl = useCallback((url: string, detected: LinkTemplate | null) => {
    if (detected) {
      setFormData({
        ...initialFormData,
        url,
        title: detected.defaultTitle || "",
        iconName: detected.iconName,
        thumbnailType: detected.iconName ? "icon" : "none",
      });
    } else {
      setFormData({
        ...initialFormData,
        url,
      });
    }
    setShowAddModal(false);
    setShowForm(true);
  }, []);

  // Handler for quick type selection
  const handleQuickType = useCallback((typeId: string) => {
    if (typeId === "link") {
      setFormData(initialFormData);
    } else if (typeId === "page") {
      setFormData({
        ...initialFormData,
        isPageLink: true,
        iconName: "FileText",
        thumbnailType: "icon",
      });
    } else if (typeId === "header") {
      setFormData({
        ...initialFormData,
        linkType: "header",
      });
    }
    setShowAddModal(false);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((link: Link) => {
    setEditingLink(link);
    // Determine if it's a custom icon (has thumbnail_url with icon type but no icon_name)
    const isCustomIcon = link.thumbnail_type === "icon" && !link.icon_name && link.thumbnail_url;
    // Determine link type from database (defaults to "link" for backwards compatibility)
    const linkType: LinkType = (link as Link & { link_type?: LinkType }).link_type || "link";
    setFormData({
      title: link.title,
      url: link.url || "",
      linkType,
      isPageLink: false,
      targetPageId: null,
      thumbnailType: link.thumbnail_type,
      thumbnailUrl: link.thumbnail_url,
      iconName: link.icon_name,
      customIconUrl: isCustomIcon ? link.thumbnail_url : null,
      scheduleEnabled: link.schedule_enabled,
      startsAt: link.starts_at ? new Date(link.starts_at) : null,
      endsAt: link.ends_at ? new Date(link.ends_at) : null,
    });
    setShowForm(true);
  }, []);

  // Schedule validation
  const scheduleError = useMemo(() => {
    if (!formData.scheduleEnabled) return null;
    if (formData.startsAt && formData.endsAt) {
      if (formData.startsAt >= formData.endsAt) {
        return "A data de início deve ser anterior à data de fim";
      }
    }
    return null;
  }, [formData.scheduleEnabled, formData.startsAt, formData.endsAt]);

  const handleSubmit = useCallback(() => {
    // Validate title
    if (!formData.title.trim()) {
      toast({ variant: "destructive", title: "Título obrigatório" });
      return;
    }

    // Validate URL only for regular links (not headers, not page links)
    if (formData.linkType === "link" && !formData.isPageLink) {
      if (!isValidUrl(formData.url)) {
        toast({
          variant: "destructive",
          title: "URL inválida",
          description: "Insira uma URL válida começando com http:// ou https://",
        });
        return;
      }
    }

    // Validate page selection for page links
    if (formData.isPageLink && !formData.targetPageId) {
      toast({ variant: "destructive", title: "Selecione uma página" });
      return;
    }

    // Build URL for page links
    let finalUrl = formData.url;
    if (formData.isPageLink && formData.targetPageId) {
      const targetPage = pages.find((p) => p.id === formData.targetPageId);
      if (targetPage) {
        finalUrl = `${window.location.origin}/${targetPage.handle}`;
      }
    }

    // Validate schedule
    if (scheduleError) {
      toast({ variant: "destructive", title: "Erro no agendamento", description: scheduleError });
      return;
    }

    if (editingLink) {
      // For headers, clear URL and thumbnail settings
      const isHeader = formData.linkType === "header";
      
      // For icon type: if we have customIconUrl, save it as thumbnail_url with null icon_name
      // Otherwise, save icon_name normally
      const thumbnailUrl = isHeader 
        ? null 
        : formData.thumbnailType === "upload" 
          ? formData.thumbnailUrl 
          : formData.thumbnailType === "icon" && formData.customIconUrl 
            ? formData.customIconUrl 
            : null;
      const iconName = isHeader 
        ? null 
        : formData.thumbnailType === "icon" && !formData.customIconUrl 
          ? formData.iconName 
          : null;

      const updates: UpdateLinkInput = {
        id: editingLink.id,
        title: formData.title,
        url: isHeader ? null : finalUrl,
        link_type: formData.linkType,
        thumbnail_type: isHeader ? "none" : formData.thumbnailType,
        thumbnail_url: thumbnailUrl,
        icon_name: iconName,
        schedule_enabled: isHeader ? false : formData.scheduleEnabled,
        starts_at: !isHeader && formData.scheduleEnabled && formData.startsAt 
          ? formData.startsAt.toISOString() 
          : null,
        ends_at: !isHeader && formData.scheduleEnabled && formData.endsAt 
          ? formData.endsAt.toISOString() 
          : null,
      };
      updateLink(updates);
    } else {
      // Same logic for create
      const isHeader = formData.linkType === "header";
      
      const thumbnailUrl = isHeader 
        ? null 
        : formData.thumbnailType === "upload" 
          ? formData.thumbnailUrl 
          : formData.thumbnailType === "icon" && formData.customIconUrl 
            ? formData.customIconUrl 
            : null;
      const iconName = isHeader 
        ? null 
        : formData.thumbnailType === "icon" && !formData.customIconUrl 
          ? formData.iconName 
          : null;

      const input: CreateLinkInput = {
        title: formData.title,
        url: isHeader ? null : finalUrl,
        link_type: formData.linkType,
        thumbnail_type: isHeader ? "none" : formData.thumbnailType,
        thumbnail_url: thumbnailUrl,
        icon_name: iconName,
        schedule_enabled: isHeader ? false : formData.scheduleEnabled,
        starts_at: !isHeader && formData.scheduleEnabled && formData.startsAt 
          ? formData.startsAt.toISOString() 
          : null,
        ends_at: !isHeader && formData.scheduleEnabled && formData.endsAt 
          ? formData.endsAt.toISOString() 
          : null,
      };
      createLink(input);
    }
    resetForm();
  }, [formData, editingLink, createLink, updateLink, resetForm, toast, scheduleError, pages, profile]);

  const handleThumbnailUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const linkId = editingLink?.id || crypto.randomUUID();
      const url = await uploadThumbnail(linkId, file);
      if (url) {
        setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
      }
      return url;
    },
    [editingLink, uploadThumbnail]
  );

  // Handler for custom icon upload
  const handleIconUpload = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        return await encodeImageToDataUrl(file, { maxDim: 64 });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: error instanceof Error ? error.message : "Não foi possível processar a imagem.",
        });
        return null;
      }
    },
    [toast]
  );

  const toggleActive = useCallback(
    (link: Link) => {
      updateLink({ id: link.id, is_active: !link.is_active });
    },
    [updateLink]
  );

  // Toggle featured with limit of 1 per page
  const toggleFeatured = useCallback(
    (link: Link) => {
      if (!link.is_featured) {
        // If activating featured, deactivate any other featured link first
        const currentFeatured = links.find((l) => l.is_featured && l.id !== link.id);
        if (currentFeatured) {
          updateLink({ id: currentFeatured.id, is_featured: false });
        }
      }
      updateLink({ id: link.id, is_featured: !link.is_featured });
    },
    [links, updateLink]
  );

  // Delete handlers with AlertDialog
  const handleDeleteClick = useCallback((linkId: string) => {
    setLinkToDelete(linkId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (linkToDelete) {
      deleteLink(linkToDelete);
      setLinkToDelete(null);
    }
    setDeleteDialogOpen(false);
  }, [linkToDelete, deleteLink]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Botões</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus botões e organize a ordem de exibição
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="gradient-primary text-primary-foreground rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Botão
          </Button>
        </div>

        {/* Add/Edit Link Form */}
        {showForm && (
          <GlassCard className="p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {editingLink 
                  ? (formData.linkType === "header" ? "Editar Cabeçalho" : formData.isPageLink ? "Editar Botão de Página" : "Editar Botão")
                  : (formData.linkType === "header" ? "Adicionar Cabeçalho" : formData.isPageLink ? "Adicionar Botão de Página" : "Adicionar Novo Botão")}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Header info message */}
              {formData.linkType === "header" && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  💡 Cabeçalhos são separadores visuais para organizar seus botões em seções.
                </div>
              )}
              {/* Page link info message */}
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
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
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, url: e.target.value }))
                        }
                        className="input-styled flex-1"
                      />
                      {hasUtmTemplate && formData.url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const urlWithUtm = applyUtmToUrl(formData.url);
                            if (urlWithUtm !== formData.url) {
                              setFormData((prev) => ({ ...prev, url: urlWithUtm }));
                              toast({ title: "UTM aplicado!" });
                            } else {
                              toast({ variant: "destructive", title: "URL inválida ou UTM já aplicado" });
                            }
                          }}
                          className="shrink-0"
                          title="Aplicar parâmetros UTM configurados"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Aplicar UTM
                        </Button>
                      )}
                    </div>
                    {hasUtmTemplate && (
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
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, targetPageId: value }))
                      }
                    >
                      <SelectTrigger className="input-styled">
                        <SelectValue placeholder="Selecione uma página" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages
                          .filter((p) => p.id !== page?.id)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title || p.handle}
                            </SelectItem>
                          ))}
                        {pages.filter((p) => p.id !== page?.id).length === 0 && (
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
                        setFormData((prev) => ({
                          ...prev,
                          thumbnailType: value as ThumbnailType,
                        }))
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="thumb-none" />
                        <Label htmlFor="thumb-none" className="font-normal cursor-pointer">
                          Nenhuma
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="upload" id="thumb-upload" />
                        <Label htmlFor="thumb-upload" className="font-normal cursor-pointer">
                          Upload
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="icon" id="thumb-icon" />
                        <Label htmlFor="thumb-icon" className="font-normal cursor-pointer">
                          Ícone
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Thumbnail Upload */}
                  {formData.thumbnailType === "upload" && (
                    <div className="max-w-xs">
                      <FileUpload
                        onUpload={handleThumbnailUpload}
                        currentUrl={formData.thumbnailUrl}
                        onRemove={() =>
                          setFormData((prev) => ({ ...prev, thumbnailUrl: null }))
                        }
                        label=""
                      />
                    </div>
                  )}

                  {/* Icon Selector */}
                  {formData.thumbnailType === "icon" && (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowIconSelector(true)}
                        className="gap-2"
                      >
                        {formData.iconName ? (
                          <>
                            <DynamicIcon name={formData.iconName} className="h-4 w-4" />
                            <span>{formData.iconName}</span>
                          </>
                        ) : formData.customIconUrl ? (
                          <>
                            <img 
                              src={formData.customIconUrl} 
                              alt="Custom icon" 
                              className="h-4 w-4 object-contain" 
                            />
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
                    <Label htmlFor="schedule-enabled" className="cursor-pointer">
                      Agendar exibição
                    </Label>
                  </div>

                  <Collapsible open={formData.scheduleEnabled}>
                    <CollapsibleContent className="space-y-4 pt-2">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Start Date */}
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
                                {formData.startsAt
                                  ? format(formData.startsAt, "PPP", { locale: ptBR })
                                  : "Selecionar data"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.startsAt ?? undefined}
                                onSelect={(date) =>
                                  setFormData((prev) => ({ ...prev, startsAt: date ?? null }))
                                }
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* End Date */}
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
                                {formData.endsAt
                                  ? format(formData.endsAt, "PPP", { locale: ptBR })
                                  : "Selecionar data"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.endsAt ?? undefined}
                                onSelect={(date) =>
                                  setFormData((prev) => ({ ...prev, endsAt: date ?? null }))
                                }
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Schedule validation error */}
                      {scheduleError && (
                        <p className="text-sm text-destructive">{scheduleError}</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title || (formData.linkType === "link" && !formData.isPageLink && !formData.url) || (formData.isPageLink && !formData.targetPageId) || isCreating || isUpdating}
                  className="gradient-primary text-primary-foreground rounded-xl"
                >
                  {isCreating || isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingLink ? "Salvar" : "Adicionar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-xl border-border/50"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Lead Form Card (fixed at top when enabled) */}
        {page?.lead_form_enabled && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">
                  {page.lead_form_title || "Formulário de Leads"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Exibido no topo da sua página pública
                </p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                Ativo
              </span>
            </div>
          </GlassCard>
        )}

        {/* Links List */}
        {links.length === 0 ? (
          <GlassCard className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum link ainda
              </h3>
              <p className="text-muted-foreground mb-6">
                Clique em "Novo Link" para começar a adicionar seus links.
              </p>
            </div>
          </GlassCard>
        ) : (
          <SortableLinksList
            links={links}
            clickCounts={clickCounts}
            onReorder={reorderLinks}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onToggleActive={toggleActive}
            onToggleFeatured={toggleFeatured}
          />
        )}


        </div>

        {/* Mobile Preview */}
        <div className="w-[320px] shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Preview
              </h3>
              {theme && (
                <MobilePreview
                  theme={{
                    background_type: theme.background_type,
                    background_value: theme.background_value,
                    custom_background_url: theme.custom_background_url,
                    text_color: theme.text_color,
                    accent_color: theme.accent_color,
                    font_family: theme.font_family,
                    button_style: theme.button_style,
                    button_radius: theme.button_radius,
                  }}
                  profile={profile}
                  links={links?.map(l => ({ 
                    id: l.id, 
                    title: l.title, 
                    url: l.url,
                    link_type: l.link_type as "link" | "header",
                  })) || []}
                  leadForm={page ? {
                    enabled: page.lead_form_enabled,
                    title: page.lead_form_title || "Fique por dentro",
                    description: page.lead_form_description || "Cadastre seu e-mail para receber novidades",
                    fields: Array.isArray(page.lead_form_fields) ? (page.lead_form_fields as any[]) : undefined,
                  } : null}
                />
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Icon Selector Dialog */}
      <IconSelector
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        selectedIcon={formData.iconName}
        customIconUrl={formData.customIconUrl}
        onSelectLibraryIcon={(iconName) =>
          setFormData((prev) => ({ 
            ...prev, 
            iconName, 
            customIconUrl: null 
          }))
        }
        onSelectCustomIcon={(url) =>
          setFormData((prev) => ({ 
            ...prev, 
            iconName: null, 
            customIconUrl: url 
          }))
        }
        onUploadIcon={handleIconUpload}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O link será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Link Modal */}
      <AddLinkModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSelectTemplate={handleSelectTemplate}
        onPasteUrl={handlePasteUrl}
        onQuickType={handleQuickType}
      />
    </>
  );
}
