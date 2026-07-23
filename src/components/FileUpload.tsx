import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 2;

interface FileUploadProps {
  onUpload: (file: File) => Promise<string | null>;
  currentUrl?: string | null;
  onRemove?: () => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  aspectRatio?: "square" | "video";
}

export function FileUpload({
  onUpload,
  currentUrl,
  onRemove,
  label = "Upload de imagem",
  accept = ALLOWED_IMAGE_TYPES.join(","),
  maxSizeMB = MAX_FILE_SIZE_MB,
  className,
  aspectRatio = "square",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = useCallback(
    (file: File): boolean => {
      const allowedTypes = accept.split(",").map((t) => t.trim());
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Tipo inválido",
          description: "Apenas JPG, PNG e WebP são permitidos.",
        });
        return false;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: `O tamanho máximo é ${maxSizeMB}MB.`,
        });
        return false;
      }

      return true;
    },
    [accept, maxSizeMB, toast]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload
      setIsUploading(true);
      setProgress(30);

      try {
        setProgress(60);
        const url = await onUpload(file);
        setProgress(100);

        if (url) {
          setPreviewUrl(url);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: "Não foi possível fazer o upload do arquivo.",
        });
        setPreviewUrl(currentUrl || null);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [validateFile, onUpload, currentUrl, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  }, [onRemove]);

  const aspectClass = aspectRatio === "square" ? "aspect-square" : "aspect-video";

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors overflow-hidden",
          aspectClass,
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          isUploading && "pointer-events-none"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isUploading}
        />

        {previewUrl ? (
          <div className="relative w-full h-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!isUploading && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-20 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-medium">
                    Arraste ou clique para upload
                  </p>
                  <p className="text-xs mt-1">
                    JPG, PNG ou WebP (máx. {maxSizeMB}MB)
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
}
