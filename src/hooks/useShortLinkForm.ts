import { useCallback, useState } from "react";
import { useShortLinks, isValidSlug } from "./useShortLinks";
import { useToast } from "./use-toast";

interface ShortLinkFormData {
  slug: string;
  destinationType: "url" | "link";
  destinationUrl: string;
  linkId: string;
}

const initialFormData: ShortLinkFormData = {
  slug: "",
  destinationType: "url",
  destinationUrl: "",
  linkId: "",
};

/**
 * Estado + validação + submit do formulário de criar short link — extraído de
 * ShortLinksScreen.tsx (que também acumulava o painel de QR code, sem relação nenhuma com
 * isso; ver docs/auditoria-refactor/01-codigo-gaps-dead-code-refactor.md).
 */
export function useShortLinkForm() {
  const { createShortLink, isCreating, generateUniqueSlug } = useShortLinks();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ShortLinkFormData>(initialFormData);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setShowForm(false);
  }, []);

  const handleGenerateSlug = useCallback(async () => {
    setIsGeneratingSlug(true);
    try {
      const slug = await generateUniqueSlug();
      setFormData((prev) => ({ ...prev, slug }));
    } finally {
      setIsGeneratingSlug(false);
    }
  }, [generateUniqueSlug]);

  const openForm = useCallback(() => {
    resetForm();
    handleGenerateSlug();
    setShowForm(true);
  }, [resetForm, handleGenerateSlug]);

  const handleSubmit = useCallback(() => {
    if (!formData.slug.trim()) {
      toast({ variant: "destructive", title: "Slug obrigatório" });
      return;
    }
    if (!isValidSlug(formData.slug)) {
      toast({
        variant: "destructive",
        title: "Slug inválido",
        description: "Use 3-20 caracteres alfanuméricos ou hífen",
      });
      return;
    }

    if (formData.destinationType === "url") {
      if (!formData.destinationUrl.trim()) {
        toast({ variant: "destructive", title: "URL de destino obrigatória" });
        return;
      }
      createShortLink({ slug: formData.slug, destination_url: formData.destinationUrl });
    } else {
      if (!formData.linkId) {
        toast({ variant: "destructive", title: "Selecione um link" });
        return;
      }
      createShortLink({ slug: formData.slug, link_id: formData.linkId });
    }
    resetForm();
  }, [formData, createShortLink, resetForm, toast]);

  return {
    showForm,
    formData,
    setFormData,
    isGeneratingSlug,
    isCreating,
    openForm,
    resetForm,
    handleGenerateSlug,
    handleSubmit,
  };
}

export type UseShortLinkFormReturn = ReturnType<typeof useShortLinkForm>;
