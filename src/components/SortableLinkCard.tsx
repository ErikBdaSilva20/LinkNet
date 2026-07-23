import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GlassCard } from "@/components/GlassCard";
import { Switch } from "@/components/ui/switch";
import { DynamicIcon } from "@/components/IconSelector";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  GripVertical,
  ExternalLink,
  Trash2,
  Edit2,
  Star,
  Clock,
  Type,
} from "lucide-react";
import type { Link } from "@/hooks/useLinks";

interface SortableLinkCardProps {
  link: Link;
  clickCount: number;
  onEdit: (link: Link) => void;
  onDelete: (linkId: string) => void;
  onToggleActive: (link: Link) => void;
  onToggleFeatured: (link: Link) => void;
}

export function SortableLinkCard({
  link,
  clickCount,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
}: SortableLinkCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if this is a header (backwards compatible)
  const isHeader = (link as Link & { link_type?: string }).link_type === "header";

  // Header rendering
  if (isHeader) {
    return (
      <GlassCard
        ref={setNodeRef}
        style={style}
        className={cn(
          "p-3 transition-all duration-200 bg-muted/30 border-dashed",
          isDragging && "opacity-80 shadow-2xl scale-[1.02] z-50 ring-2 ring-primary/50"
        )}
      >
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
            aria-label="Arrastar para reordenar"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Header Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Type className="h-5 w-5 text-primary" />
          </div>

          {/* Header Title */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {link.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              Cabeçalho de seção
            </p>
          </div>

          {/* Actions - Only edit and delete for headers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(link)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Editar cabeçalho"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(link.id)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              title="Excluir cabeçalho"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Regular link rendering
  return (
    <GlassCard
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 transition-all duration-200",
        !link.is_active && "opacity-50",
        isDragging && "opacity-80 shadow-2xl scale-[1.02] z-50 ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Thumbnail/Icon */}
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {link.thumbnail_type === "upload" && link.thumbnail_url ? (
            <img
              src={link.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : link.thumbnail_type === "icon" && link.icon_name ? (
            <DynamicIcon name={link.icon_name} className="h-5 w-5 text-foreground" />
          ) : (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Link Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">
              {link.title}
            </h4>
            {link.is_featured && (
              <Star className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {link.url}
          </p>
          {/* Schedule badge */}
          {link.schedule_enabled && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>
                {link.starts_at && format(new Date(link.starts_at), "dd/MM")}
                {link.starts_at && link.ends_at && " - "}
                {link.ends_at && format(new Date(link.ends_at), "dd/MM")}
                {!link.starts_at && !link.ends_at && "Agendado"}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-foreground">
            {clickCount}
          </p>
          <p className="text-xs text-muted-foreground">cliques</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFeatured(link)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              link.is_featured
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
            title={link.is_featured ? "Remover destaque" : "Destacar link"}
          >
            <Star
              className={cn("h-4 w-4", link.is_featured && "fill-primary")}
            />
          </button>
          <button
            onClick={() => onEdit(link)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Editar link"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
            title="Excluir link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <Switch
            checked={link.is_active}
            onCheckedChange={() => onToggleActive(link)}
          />
        </div>
      </div>
    </GlassCard>
  );
}