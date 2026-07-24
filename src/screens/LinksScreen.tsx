import { GlassCard } from "@/components/GlassCard";
import { MobilePreview } from "@/components/MobilePreview";
import { LinkFormCard } from "@/components/LinkFormCard";
import { useActivePage } from "@/contexts/ActivePageContext";
import { Button } from "@/components/ui/button";
import { AddLinkModal } from "@/components/AddLinkModal";
import { SortableLinksList } from "@/components/SortableLinksList";
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
import { useLinks, type Link } from "@/hooks/useLinks";
import { useLinkForm } from "@/hooks/useLinkForm";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { parseFormFields } from "@/lib/leadFormFields";
import { Plus, ExternalLink, Loader2, Mail } from "lucide-react";
import { useState, useCallback } from "react";

export default function LinksScreen() {
  const { links, isLoading, clickCounts, updateLink, deleteLink, reorderLinks } = useLinks();
  const { theme } = useTheme();
  const { profile } = useProfile();
  const { page } = useActivePage();

  const form = useLinkForm();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const toggleActive = useCallback(
    (link: Link) => updateLink({ id: link.id, is_active: !link.is_active }),
    [updateLink]
  );

  // Só 1 link em destaque por página: desativa o anterior antes de ativar o novo
  const toggleFeatured = useCallback(
    (link: Link) => {
      if (!link.is_featured) {
        const currentFeatured = links.find((l) => l.is_featured && l.id !== link.id);
        if (currentFeatured) {
          updateLink({ id: currentFeatured.id, is_featured: false });
        }
      }
      updateLink({ id: link.id, is_featured: !link.is_featured });
    },
    [links, updateLink]
  );

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
              onClick={form.openAddModal}
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Botão
            </Button>
          </div>

          {form.showForm && <LinkFormCard form={form} />}

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
              onEdit={form.handleEdit}
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
                  links={links?.map((l) => ({
                    id: l.id,
                    title: l.title,
                    url: l.url,
                    link_type: l.link_type as "link" | "header",
                  })) || []}
                  leadForm={page ? {
                    enabled: page.lead_form_enabled,
                    title: page.lead_form_title || "Fique por dentro",
                    description: page.lead_form_description || "Cadastre seu e-mail para receber novidades",
                    fields: parseFormFields(page.lead_form_fields),
                  } : null}
                />
              )}
            </GlassCard>
          </div>
        </div>
      </div>

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
        open={form.showAddModal}
        onOpenChange={form.setShowAddModal}
        onSelectTemplate={form.handleSelectTemplate}
        onPasteUrl={form.handlePasteUrl}
        onQuickType={form.handleQuickType}
      />
    </>
  );
}
