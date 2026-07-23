import { useState, useEffect } from "react";
import { usePages } from "@/hooks/usePages";
import { useProfile } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CreatePageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePageModal({ open, onOpenChange }: CreatePageModalProps) {
  const { createPageAsync, isCreating, isValidSlug } = usePages();
  const { profile } = useProfile();
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      const generated = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-")     // Replace non-alphanumeric with hyphens
        .replace(/^-|-$/g, "")           // Remove leading/trailing hyphens
        .slice(0, 30);
      setSlug(generated);
    }
  }, [title]);

  // Validate slug on change
  useEffect(() => {
    if (slug) {
      if (!isValidSlug(slug)) {
        setSlugError("Use apenas letras minúsculas, números e hífens (3-30 caracteres)");
      } else {
        setSlugError(null);
      }
    } else {
      setSlugError(null);
    }
  }, [slug, isValidSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !slug.trim()) return;
    if (slugError) return;

    try {
      await createPageAsync({ title: title.trim(), slug: slug.trim() });
      onOpenChange(false);
      setTitle("");
      setSlug("");
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTitle("");
    setSlug("");
    setSlugError(null);
  };

  const previewUrl = profile?.handle 
    ? `/${profile.handle}/${slug || "..."}`
    : `/${slug || "..."}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Página</DialogTitle>
          <DialogDescription>
            Crie uma nova página de links com tema e configurações independentes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Página</Label>
            <Input
              id="title"
              placeholder="Ex: Portfolio, Cursos, Loja"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              URL da Página
            </Label>
            <Input
              id="slug"
              placeholder="portfolio"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className={slugError ? "border-destructive" : ""}
            />
            {slugError ? (
              <p className="text-xs text-destructive">{slugError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sua página será acessível em{" "}
                <span className="font-mono text-foreground">{previewUrl}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !slug.trim() || !!slugError || isCreating}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Página
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
