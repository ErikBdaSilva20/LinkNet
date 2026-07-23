import { useState, useEffect } from "react";
import { usePages } from "@/hooks/usePages";
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
  const { createPageAsync, isCreating, isValidHandle } = usePages();

  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);

  // Auto-generate handle from title
  useEffect(() => {
    if (title) {
      const generated = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "_")     // Replace non-alphanumeric with underscore
        .replace(/^_|_$/g, "")           // Remove leading/trailing underscore
        .slice(0, 20);
      setHandle(generated);
    }
  }, [title]);

  // Validate handle on change
  useEffect(() => {
    if (handle) {
      if (!isValidHandle(handle)) {
        setHandleError("Use apenas letras minúsculas, números e _ (3-20 caracteres)");
      } else {
        setHandleError(null);
      }
    } else {
      setHandleError(null);
    }
  }, [handle, isValidHandle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !handle.trim()) return;
    if (handleError) return;

    try {
      await createPageAsync({ title: title.trim(), handle: handle.trim() });
      onOpenChange(false);
      setTitle("");
      setHandle("");
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTitle("");
    setHandle("");
    setHandleError(null);
  };

  const previewUrl = `/${handle || "..."}`;

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
            <Label htmlFor="handle">
              URL da Página
            </Label>
            <Input
              id="handle"
              placeholder="portfolio"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className={handleError ? "border-destructive" : ""}
            />
            {handleError ? (
              <p className="text-xs text-destructive">{handleError}</p>
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
              disabled={!title.trim() || !handle.trim() || !!handleError || isCreating}
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
