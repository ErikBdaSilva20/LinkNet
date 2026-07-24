import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Phone, Type, CalendarDays } from "lucide-react";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormField } from "@/lib/leadFormFields";

interface LeadFormFieldsConfiguratorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const typeLabels: Record<string, string> = {
  text: "Texto",
  email: "E-mail",
  phone: "Telefone",
  date: "Data",
};

// ============= Sortable Field Item =============

interface SortableFieldItemProps {
  field: FormField;
  isBuiltIn: boolean;
  onToggleField: (id: string) => void;
  onToggleRequired: (id: string) => void;
  onRemoveField: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
}

function SortableFieldItem({
  field,
  isBuiltIn,
  onToggleField,
  onToggleRequired,
  onRemoveField,
  onUpdateLabel,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-field-id={field.id}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        {isBuiltIn ? (
          <p className="text-sm font-medium text-foreground">{field.label}</p>
        ) : (
          <Input
            value={field.label}
            onChange={(e) => onUpdateLabel(field.id, e.target.value)}
            className="h-8 text-sm input-styled"
            maxLength={50}
          />
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {typeLabels[field.type]}
          {field.required && " • Obrigatório"}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Obrigatório</span>
          <Switch
            checked={field.required}
            onCheckedChange={() => onToggleRequired(field.id)}
            className="scale-75"
          />
        </div>

        <Switch
          checked={field.enabled}
          onCheckedChange={() => onToggleField(field.id)}
          disabled={field.id === "email"}
        />

        {!isBuiltIn && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveField(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============= Main Component =============

export function LeadFormFieldsConfigurator({ fields, onChange }: LeadFormFieldsConfiguratorProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customType, setCustomType] = useState<"text" | "date">("text");
  const [addStep, setAddStep] = useState<"choose" | "custom">("choose");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const isBuiltIn = (id: string) => ["name", "email"].includes(id);
  const hasPhone = fields.some(f => f.id === "phone");

  const fieldIds = useMemo(() => fields.map(f => f.id), [fields]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeField = useMemo(
    () => fields.find(f => f.id === activeId),
    [fields, activeId]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    const el = document.querySelector(`[data-field-id="${event.active.id}"]`);
    setDragWidth(el ? el.getBoundingClientRect().width : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const toggleField = (id: string) => {
    if (id === "email") return;
    onChange(fields.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const toggleRequired = (id: string) => {
    onChange(fields.map(f => f.id === id ? { ...f, required: !f.required } : f));
  };

  const removeField = (id: string) => {
    if (isBuiltIn(id)) return;
    onChange(fields.filter(f => f.id !== id));
  };

  const updateLabel = (id: string, label: string) => {
    onChange(fields.map(f => f.id === id ? { ...f, label } : f));
  };

  const addPhoneField = () => {
    if (hasPhone) return;
    onChange([...fields, { id: "phone", type: "phone", label: "Telefone", enabled: true, required: false }]);
    setAddModalOpen(false);
    resetModal();
  };

  const addCustomField = () => {
    const label = customLabel.trim();
    if (!label) return;
    const id = `custom_${Date.now()}`;
    onChange([...fields, { id, type: customType, label, enabled: true, required: false }]);
    setAddModalOpen(false);
    resetModal();
  };

  const resetModal = () => {
    setAddStep("choose");
    setCustomLabel("");
    setCustomType("text");
  };

  return (
    <div className="space-y-4">
      <Label className="text-foreground font-medium">Campos do formulário</Label>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {fields.map((field) => (
              <SortableFieldItem
                key={field.id}
                field={field}
                isBuiltIn={isBuiltIn(field.id)}
                onToggleField={toggleField}
                onToggleRequired={toggleRequired}
                onRemoveField={removeField}
                onUpdateLabel={updateLabel}
              />
            ))}
          </div>
        </SortableContext>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeField ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background border-2 border-primary/50 shadow-2xl opacity-95" style={{ width: dragWidth ? `${dragWidth}px` : 'auto' }}>
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activeField.label}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[activeField.type]}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Add field button + modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => { setAddModalOpen(open); if (!open) resetModal(); }}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full rounded-xl border-dashed border-border/50 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar campo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addStep === "choose" ? "Adicionar campo" : "Campo personalizado"}
            </DialogTitle>
          </DialogHeader>

          {addStep === "choose" ? (
            <div className="space-y-2 pt-2">
              {!hasPhone && (
                <button
                  onClick={addPhoneField}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Telefone</p>
                    <p className="text-xs text-muted-foreground">Campo de telefone do visitante</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => { setAddStep("custom"); setCustomType("text"); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Type className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Texto personalizado</p>
                  <p className="text-xs text-muted-foreground">Campo de texto livre com nome customizado</p>
                </div>
              </button>

              <button
                onClick={() => { setAddStep("custom"); setCustomType("date"); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Data</p>
                  <p className="text-xs text-muted-foreground">Campo de seleção de data</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome do campo</Label>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Ex: Empresa, CPF, Cidade..."
                  className="input-styled"
                  maxLength={50}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tipo: <span className="font-medium text-foreground">{customType === "text" ? "Texto" : "Data"}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setAddStep("choose")}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground rounded-xl"
                  onClick={addCustomField}
                  disabled={!customLabel.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
