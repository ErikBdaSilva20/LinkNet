import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableLinkCard } from "./SortableLinkCard";
import { GlassCard } from "@/components/GlassCard";
import { DynamicIcon } from "@/components/IconSelector";
import { GripVertical, ExternalLink, Star } from "lucide-react";
import type { Link } from "@/hooks/useLinks";
import { cn } from "@/lib/utils";

interface SortableLinksListProps {
  links: Link[];
  clickCounts: Record<string, number>;
  onReorder: (orderedIds: string[]) => void;
  onEdit: (link: Link) => void;
  onDelete: (linkId: string) => void;
  onToggleActive: (link: Link) => void;
  onToggleFeatured: (link: Link) => void;
}

export function SortableLinksList({
  links,
  clickCounts,
  onReorder,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
}: SortableLinksListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const linkIds = useMemo(() => links.map((l) => l.id), [links]);

  const activeLink = useMemo(
    () => links.find((l) => l.id === activeId),
    [links, activeId]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);

      const newOrder = arrayMove(links, oldIndex, newIndex);
      onReorder(newOrder.map((l) => l.id));
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={linkIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {links.map((link) => (
            <SortableLinkCard
              key={link.id}
              link={link}
              clickCount={clickCounts[link.id] || 0}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              onToggleFeatured={onToggleFeatured}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - shows a preview while dragging */}
      <DragOverlay>
        {activeLink ? (
          <GlassCard className="p-4 shadow-2xl ring-2 ring-primary/50 opacity-95">
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground">
                <GripVertical className="h-5 w-5" />
              </div>

              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {activeLink.thumbnail_type === "upload" && activeLink.thumbnail_url ? (
                  <img
                    src={activeLink.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : activeLink.thumbnail_type === "icon" && activeLink.icon_name ? (
                  <DynamicIcon name={activeLink.icon_name} className="h-5 w-5 text-foreground" />
                ) : (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground truncate">
                    {activeLink.title}
                  </h4>
                  {activeLink.is_featured && (
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {activeLink.url}
                </p>
              </div>
            </div>
          </GlassCard>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
