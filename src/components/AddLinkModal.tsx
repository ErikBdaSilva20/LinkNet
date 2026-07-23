import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronRight,
  Sparkles,
  Heart,
  Play,
  MessageCircle,
  ShoppingBag,
  Calendar,
  MoreHorizontal,
  Type,
  FileText,
} from "lucide-react";
import { DynamicIcon } from "@/components/IconSelector";
import {
  LINK_CATEGORIES,
  QUICK_TYPES,
  detectPlatformFromUrl,
  getTemplatesByCategory,
  type LinkTemplate,
} from "@/data/linkTemplates";

// Icon map for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Heart,
  Play,
  MessageCircle,
  ShoppingBag,
  Calendar,
  MoreHorizontal,
};

// Icon map for quick types
const QUICK_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Link: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  FileText,
  Type,
};

interface AddLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: LinkTemplate) => void;
  onPasteUrl: (url: string, template: LinkTemplate | null) => void;
  onQuickType: (type: string) => void;
}

export function AddLinkModal({
  open,
  onOpenChange,
  onSelectTemplate,
  onPasteUrl,
  onQuickType,
}: AddLinkModalProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("suggested");

  // Handle search/paste
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);

      // Check if it's a URL
      if (value.includes("http://") || value.includes("https://")) {
        const detected = detectPlatformFromUrl(value);
        // Auto-detect and proceed after a small delay
        setTimeout(() => {
          onPasteUrl(value, detected);
          setSearchValue("");
          onOpenChange(false);
        }, 300);
      }
    },
    [onPasteUrl, onOpenChange]
  );

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    const categoryTemplates = getTemplatesByCategory(selectedCategory);

    if (!searchValue.trim()) {
      return categoryTemplates;
    }

    const query = searchValue.toLowerCase();
    return categoryTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
    );
  }, [selectedCategory, searchValue]);

  // Get category display name
  const categoryName = useMemo(() => {
    const cat = LINK_CATEGORIES.find((c) => c.id === selectedCategory);
    return cat?.name || "Templates";
  }, [selectedCategory]);

  const handleTemplateClick = useCallback(
    (template: LinkTemplate) => {
      onSelectTemplate(template);
      setSearchValue("");
      onOpenChange(false);
    },
    [onSelectTemplate, onOpenChange]
  );

  const handleQuickTypeClick = useCallback(
    (typeId: string) => {
      onQuickType(typeId);
      setSearchValue("");
      onOpenChange(false);
    },
    [onQuickType, onOpenChange]
  );

  const handleClose = useCallback(() => {
    setSearchValue("");
    setSelectedCategory("suggested");
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold">Adicionar</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Colar ou buscar um link..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-11 bg-muted/50 border-0 focus-visible:ring-1"
              autoFocus
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Categories */}
          <div className="w-48 border-r border-border/50 py-2 flex-shrink-0 hidden sm:block">
            <nav className="space-y-1 px-2">
              {LINK_CATEGORIES.map((category) => {
                const IconComponent = CATEGORY_ICONS[category.icon];
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedCategory === category.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-6">
                {/* Mobile Category Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 sm:hidden">
                  {LINK_CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex-shrink-0"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>

                {/* Quick Types */}
                {selectedCategory === "suggested" && !searchValue && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {QUICK_TYPES.map((type) => {
                      const IconComponent = QUICK_TYPE_ICONS[type.icon];
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleQuickTypeClick(type.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            {IconComponent && <IconComponent className="h-5 w-5 text-foreground" />}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {type.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Category Title */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {categoryName}
                  </h3>

                  {/* Templates List */}
                  <div className="space-y-1">
                    {filteredTemplates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum template encontrado</p>
                      </div>
                    ) : (
                      filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateClick(template)}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                        >
                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: template.iconBg || "hsl(var(--muted))",
                              color: template.iconColor,
                            }}
                          >
                            {template.iconName && (
                              <DynamicIcon
                                name={template.iconName}
                                className="w-5 h-5"
                              />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {template.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {template.description}
                            </p>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
