import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { QrCodeSection } from "@/components/QrCodeSection";
import { useShortLinks } from "@/hooks/useShortLinks";
import { useShortLinkForm } from "@/hooks/useShortLinkForm";
import { cn } from "@/lib/utils";
import { Plus, X, Loader2, Link2, Copy, RefreshCw, Trash2, QrCode } from "lucide-react";
import { useCallback, useState } from "react";

export default function ShortLinksScreen() {
  const { shortLinks, clickCounts, isLoading, links, deleteShortLink, copyToClipboard, baseUrl } =
    useShortLinks();
  const form = useShortLinkForm();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shortLinkToDelete, setShortLinkToDelete] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const handleDeleteClick = useCallback((id: string) => {
    setShortLinkToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (shortLinkToDelete) {
      deleteShortLink(shortLinkToDelete);
      setShortLinkToDelete(null);
    }
    setDeleteDialogOpen(false);
  }, [shortLinkToDelete, deleteShortLink]);

  const getLinkTitle = useCallback(
    (linkId: string | null) => {
      if (!linkId) return null;
      const link = links.find((l) => l.id === linkId);
      return link?.title || null;
    },
    [links]
  );

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Encurtador</h1>
            <p className="text-muted-foreground mt-1">
              Crie links curtos para campanhas e QR codes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowQr((v) => !v)}
              className="rounded-xl border-border/50"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button
              onClick={form.openForm}
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Link Curto
            </Button>
          </div>
        </div>

        {showQr && <QrCodeSection onClose={() => setShowQr(false)} />}

        {/* Create Form */}
        {form.showForm && (
          <GlassCard className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Criar Link Curto</h3>
              <Button variant="ghost" size="icon" onClick={form.resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Slug Input */}
              <div className="space-y-2">
                <Label htmlFor="short-slug">Slug</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      /l/
                    </span>
                    <Input
                      id="short-slug"
                      placeholder="abc123"
                      value={form.formData.slug}
                      onChange={(e) =>
                        form.setFormData((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      className="pl-9 input-styled"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={form.handleGenerateSlug}
                    disabled={form.isGeneratingSlug}
                    title="Gerar novo slug"
                  >
                    <RefreshCw className={cn("h-4 w-4", form.isGeneratingSlug && "animate-spin")} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview: {baseUrl}{form.formData.slug || "..."}
                </p>
              </div>

              {/* Destination Type */}
              <div className="space-y-3">
                <Label>Destino</Label>
                <RadioGroup
                  value={form.formData.destinationType}
                  onValueChange={(value) =>
                    form.setFormData((prev) => ({ ...prev, destinationType: value as "url" | "link" }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="dest-url" />
                    <Label htmlFor="dest-url" className="font-normal cursor-pointer">
                      URL livre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="link" id="dest-link" />
                    <Label htmlFor="dest-link" className="font-normal cursor-pointer">
                      Link existente
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Destination URL */}
              {form.formData.destinationType === "url" && (
                <div className="space-y-2">
                  <Label htmlFor="dest-url-input">URL de destino</Label>
                  <Input
                    id="dest-url-input"
                    placeholder="https://..."
                    value={form.formData.destinationUrl}
                    onChange={(e) =>
                      form.setFormData((prev) => ({ ...prev, destinationUrl: e.target.value }))
                    }
                    className="input-styled"
                  />
                </div>
              )}

              {/* Select Existing Link */}
              {form.formData.destinationType === "link" && (
                <div className="space-y-2">
                  <Label>Selecionar link</Label>
                  <Select
                    value={form.formData.linkId}
                    onValueChange={(value) =>
                      form.setFormData((prev) => ({ ...prev, linkId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um link..." />
                    </SelectTrigger>
                    <SelectContent>
                      {links.map((link) => (
                        <SelectItem key={link.id} value={link.id}>
                          {link.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {links.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum link disponível. Crie um link primeiro.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={form.handleSubmit}
                  disabled={form.isCreating}
                  className="gradient-primary text-primary-foreground rounded-lg"
                >
                  {form.isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar
                </Button>
                <Button variant="outline" onClick={form.resetForm} className="rounded-lg">
                  Cancelar
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Short Links List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : shortLinks.length === 0 && !form.showForm ? (
          <GlassCard className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum link curto ainda
              </h3>
              <p className="text-muted-foreground mb-6">
                Crie links curtos para rastrear cliques e gerar QR codes.
              </p>
              <Button
                onClick={form.openForm}
                className="gradient-primary text-primary-foreground rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Link
              </Button>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {shortLinks.map((sl) => (
              <GlassCard key={sl.id} className="p-4 animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium text-foreground truncate">
                      /l/{sl.slug}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sl.link_id ? (
                        <>→ {getLinkTitle(sl.link_id) || "Link"}</>
                      ) : (
                        <>→ {sl.destination_url}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold text-foreground">
                      {clickCounts[sl.id] || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">cliques</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(sl.slug)}
                      title="Copiar link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(sl.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link curto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O link curto será removido permanentemente.
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
    </>
  );
}
