import { useCallback, useMemo, useState } from "react";
import { useLinks, type Link, type CreateLinkInput, type UpdateLinkInput, type LinkType } from "./useLinks";
import { useIntegrations } from "./useIntegrations";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "./use-toast";
import { encodeImageToDataUrl } from "@/lib/image";
import type { Enums } from "@/lib/data/types.gen";
import type { LinkTemplate } from "@/data/linkTemplates";

type ThumbnailType = Enums<"thumbnail_type">;

export interface LinkFormData {
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

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Estado + validação + submit do formulário de criar/editar link — extraído de
 * LinksScreen.tsx (era 902 linhas misturando isso com layout; ver
 * docs/auditoria-refactor/01-codigo-gaps-dead-code-refactor.md).
 */
export function useLinkForm() {
  const { createLink, updateLink, uploadThumbnail, isCreating, isUpdating } = useLinks();
  const { hasUtmTemplate, applyUtmToUrl } = useIntegrations();
  const { page, pages } = useActivePage();
  const { toast } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState<LinkFormData>(initialFormData);
  const [showIconSelector, setShowIconSelector] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingLink(null);
    setShowForm(false);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

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
      setFormData({ ...initialFormData, url });
    }
    setShowAddModal(false);
    setShowForm(true);
  }, []);

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
      setFormData({ ...initialFormData, linkType: "header" });
    }
    setShowAddModal(false);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((link: Link) => {
    setEditingLink(link);
    // Custom icon: thumbnail_type "icon" com thumbnail_url mas sem icon_name (biblioteca)
    const isCustomIcon = link.thumbnail_type === "icon" && !link.icon_name && link.thumbnail_url;
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

  const scheduleError = useMemo(() => {
    if (!formData.scheduleEnabled) return null;
    if (formData.startsAt && formData.endsAt && formData.startsAt >= formData.endsAt) {
      return "A data de início deve ser anterior à data de fim";
    }
    return null;
  }, [formData.scheduleEnabled, formData.startsAt, formData.endsAt]);

  const handleSubmit = useCallback(() => {
    if (!formData.title.trim()) {
      toast({ variant: "destructive", title: "Título obrigatório" });
      return;
    }

    if (formData.linkType === "link" && !formData.isPageLink && !isValidUrl(formData.url)) {
      toast({
        variant: "destructive",
        title: "URL inválida",
        description: "Insira uma URL válida começando com http:// ou https://",
      });
      return;
    }

    if (formData.isPageLink && !formData.targetPageId) {
      toast({ variant: "destructive", title: "Selecione uma página" });
      return;
    }

    let finalUrl = formData.url;
    if (formData.isPageLink && formData.targetPageId) {
      const targetPage = pages.find((p) => p.id === formData.targetPageId);
      if (targetPage) {
        finalUrl = `${window.location.origin}/${targetPage.handle}`;
      }
    }

    if (scheduleError) {
      toast({ variant: "destructive", title: "Erro no agendamento", description: scheduleError });
      return;
    }

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

    const payload = {
      title: formData.title,
      url: isHeader ? null : finalUrl,
      link_type: formData.linkType,
      thumbnail_type: isHeader ? "none" as ThumbnailType : formData.thumbnailType,
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

    if (editingLink) {
      updateLink({ id: editingLink.id, ...payload } satisfies UpdateLinkInput);
    } else {
      createLink(payload satisfies CreateLinkInput);
    }
    resetForm();
  }, [formData, editingLink, createLink, updateLink, resetForm, toast, scheduleError, pages]);

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

  const handleApplyUtm = useCallback(() => {
    const urlWithUtm = applyUtmToUrl(formData.url);
    if (urlWithUtm !== formData.url) {
      setFormData((prev) => ({ ...prev, url: urlWithUtm }));
      toast({ title: "UTM aplicado!" });
    } else {
      toast({ variant: "destructive", title: "URL inválida ou UTM já aplicado" });
    }
  }, [applyUtmToUrl, formData.url, toast]);

  const onSelectLibraryIcon = useCallback((iconName: string) => {
    setFormData((prev) => ({ ...prev, iconName, customIconUrl: null }));
  }, []);

  const onSelectCustomIcon = useCallback((url: string) => {
    setFormData((prev) => ({ ...prev, iconName: null, customIconUrl: url }));
  }, []);

  return {
    // template/quick-add modal
    showAddModal,
    setShowAddModal,
    openAddModal,
    handleSelectTemplate,
    handlePasteUrl,
    handleQuickType,

    // form
    showForm,
    editingLink,
    formData,
    setFormData,
    scheduleError,
    isSubmitting: isCreating || isUpdating,
    handleEdit,
    handleSubmit,
    resetForm,

    // dependências externas que a UI do formulário precisa
    pages,
    currentPageId: page?.id,
    hasUtmTemplate,
    handleApplyUtm,

    // upload
    handleThumbnailUpload,
    handleIconUpload,

    // icon selector
    showIconSelector,
    setShowIconSelector,
    onSelectLibraryIcon,
    onSelectCustomIcon,
  };
}

export type UseLinkFormReturn = ReturnType<typeof useLinkForm>;
