import { useState, useMemo, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Search,
  Check,
  Sparkles,
  Upload,
  Loader2,
  X,
  ImageIcon,
  // Social
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Github,
  Twitch,
  AtSign,
  Hash,
  // Communication
  Mail,
  Phone,
  PhoneCall,
  MessageCircle,
  MessageCircleMore,
  Send,
  // Media
  Music,
  Music2,
  Video,
  Camera,
  Image,
  Podcast,
  Radio,
  Mic,
  Play,
  Headphones,
  // Gaming
  Gamepad2,
  Joystick,
  Trophy,
  // Shopping
  ShoppingBag,
  Store,
  CreditCard,
  Gift,
  Wallet,
  DollarSign,
  // General
  Link,
  Globe,
  ExternalLink,
  Heart,
  Star,
  Bookmark,
  Pin,
  Flame,
  Crown,
  BadgeCheck,
  // Productivity
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  File,
  Download,
  Briefcase,
  TrendingUp,
  // Others
  MapPin,
  Rss,
  Zap,
  Award,
  Coffee,
  User,
  Users,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Static icon map - guaranteed to work
const ICON_MAP: Record<string, LucideIcon> = {
  // Social
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Github,
  Twitch,
  AtSign,
  Hash,
  // Communication
  Mail,
  Phone,
  PhoneCall,
  MessageCircle,
  MessageCircleMore,
  Send,
  // Media
  Music,
  Music2,
  Video,
  Camera,
  Image,
  Podcast,
  Radio,
  Mic,
  Play,
  Headphones,
  // Gaming
  Gamepad2,
  Joystick,
  Trophy,
  // Shopping
  ShoppingBag,
  Store,
  CreditCard,
  Gift,
  Wallet,
  DollarSign,
  // General
  Link,
  Globe,
  ExternalLink,
  Heart,
  Star,
  Bookmark,
  Pin,
  Flame,
  Crown,
  BadgeCheck,
  Sparkles,
  // Productivity
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  File,
  Download,
  Briefcase,
  TrendingUp,
  // Others
  MapPin,
  Rss,
  Zap,
  Award,
  Coffee,
  User,
  Users,
  Share2,
};

// Icon categories for organized display
const ICON_CATEGORIES: Record<string, string[]> = {
  "Redes Sociais": ["Instagram", "Twitter", "Facebook", "Youtube", "Linkedin", "Github", "Twitch", "AtSign", "Hash"],
  "Mensagens": ["Mail", "Phone", "PhoneCall", "MessageCircle", "MessageCircleMore", "Send"],
  "Mídia": ["Music", "Music2", "Video", "Camera", "Image", "Podcast", "Radio", "Mic", "Play", "Headphones"],
  "Gaming": ["Gamepad2", "Joystick", "Trophy"],
  "Compras": ["ShoppingBag", "Store", "CreditCard", "Gift", "Wallet", "DollarSign"],
  "Geral": ["Link", "Globe", "ExternalLink", "Heart", "Star", "Bookmark", "Pin", "Flame", "Crown", "BadgeCheck", "Sparkles"],
  "Produtividade": ["Calendar", "Clock", "FileText", "File", "Download", "Briefcase", "TrendingUp"],
  "Outros": ["MapPin", "Rss", "Zap", "Award", "Coffee", "User", "Share2"],
};

// All icon names flattened for search
const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

interface IconSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIcon: string | null;
  customIconUrl?: string | null;
  onSelectLibraryIcon: (iconName: string) => void;
  onSelectCustomIcon?: (url: string) => void;
  onUploadIcon?: (file: File) => Promise<string | null>;
}

export function IconSelector({
  open,
  onOpenChange,
  selectedIcon,
  customIconUrl,
  onSelectLibraryIcon,
  onSelectCustomIcon,
  onUploadIcon,
}: IconSelectorProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("library");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(customIconUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter icons based on search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) {
      return ICON_CATEGORIES;
    }

    const searchLower = search.toLowerCase();
    const result: Record<string, string[]> = {};

    for (const [category, icons] of Object.entries(ICON_CATEGORIES)) {
      const filtered = icons.filter((name) =>
        name.toLowerCase().includes(searchLower)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }

    return result;
  }, [search]);

  const hasResults = Object.keys(filteredCategories).length > 0;

  const handleSelectIcon = useCallback((iconName: string) => {
    onSelectLibraryIcon(iconName);
    setUploadPreview(null);
    onOpenChange(false);
    setSearch("");
  }, [onSelectLibraryIcon, onOpenChange]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadIcon) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);

    setIsUploading(true);
    try {
      const uploadedUrl = await onUploadIcon(file);
      if (uploadedUrl) {
        setUploadPreview(uploadedUrl);
      }
    } finally {
      setIsUploading(false);
    }

    // Reset input
    e.target.value = "";
  }, [onUploadIcon]);

  const handleUseUploadedIcon = useCallback(() => {
    if (uploadPreview && onSelectCustomIcon) {
      onSelectCustomIcon(uploadPreview);
      onOpenChange(false);
    }
  }, [uploadPreview, onSelectCustomIcon, onOpenChange]);

  const handleRemoveUpload = useCallback(() => {
    setUploadPreview(null);
  }, []);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setSearch("");
      setActiveTab("library");
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="library" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2" disabled={!onUploadIcon}>
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="mt-0">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ícone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Icons Grid */}
            <ScrollArea className="h-[350px] pr-4">
              {hasResults ? (
                <div className="space-y-6">
                  {Object.entries(filteredCategories).map(([category, icons]) => (
                    <div key={category}>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">
                        {category}
                      </Label>
                      <div className="grid grid-cols-6 gap-2">
                        {icons.map((iconName) => {
                          const IconComponent = ICON_MAP[iconName];
                          if (!IconComponent) return null;

                          const isSelected = selectedIcon === iconName && !customIconUrl;

                          return (
                            <Button
                              key={iconName}
                              variant={isSelected ? "default" : "outline"}
                              size="icon"
                              className={cn(
                                "h-11 w-11 relative transition-all",
                                isSelected && "ring-2 ring-primary ring-offset-2"
                              )}
                              onClick={() => handleSelectIcon(iconName)}
                              title={iconName}
                            >
                              <IconComponent className="h-5 w-5" />
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhum ícone encontrado</p>
                  <p className="text-sm">Tente buscar por outro termo</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-0">
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isUploading && "pointer-events-none opacity-70"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Fazendo upload...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Clique para selecionar</p>
                      <p className="text-sm text-muted-foreground">
                        ou arraste uma imagem aqui
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG ou SVG (máx. 1MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Preview */}
              {uploadPreview && (
                <div className="space-y-3">
                  <Label>Preview</Label>
                  <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/30">
                    <div className="w-16 h-16 rounded-xl border-2 border-border overflow-hidden flex items-center justify-center bg-background">
                      <img
                        src={uploadPreview}
                        alt="Preview"
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Ícone customizado</p>
                      <p className="text-sm text-muted-foreground">Pronto para usar</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveUpload}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleUseUploadedIcon}
                    className="w-full gradient-primary text-primary-foreground"
                    disabled={isUploading}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Usar este ícone
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Dynamic icon renderer component
interface DynamicIconProps {
  name: string | null;
  customUrl?: string | null;
  className?: string;
}

export function DynamicIcon({ name, customUrl, className }: DynamicIconProps) {
  // Custom uploaded icon
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="Custom icon"
        className={cn("object-contain", className)}
      />
    );
  }

  // Library icon
  if (!name) return null;

  const IconComponent = ICON_MAP[name];
  if (!IconComponent) return null;

  return <IconComponent className={className} />;
}
