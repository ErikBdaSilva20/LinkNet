import { cn } from "@/lib/utils";
import { Check, Settings } from "lucide-react";
import type { CuratedTheme } from "@/data/curatedThemes";

interface ThemeCardProps {
  theme: CuratedTheme;
  isSelected: boolean;
  onSelect: () => void;
}

export function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  const isCustom = theme.id === "custom";

  const backgroundStyle = theme.thumbnail.type === "gradient" || theme.thumbnail.type === "image"
    ? { background: theme.thumbnail.value }
    : { backgroundColor: theme.thumbnail.value };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden transition-all duration-200",
        "border-2 hover:shadow-lg hover:scale-[1.02]",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Thumbnail Preview */}
      <div
        className="relative w-full h-24 flex items-center justify-center"
        style={backgroundStyle}
      >
        {/* "Aa" Typography indicator */}
        {isCustom ? (
          <div className="flex flex-col items-center gap-1">
            <Settings 
              className="h-6 w-6" 
              style={{ color: theme.thumbnail.textColor }}
            />
            <span 
              className="text-xs font-medium"
              style={{ color: theme.thumbnail.textColor }}
            >
              Personalizar
            </span>
          </div>
        ) : (
          <span 
            className="text-3xl font-serif font-bold"
            style={{ color: theme.thumbnail.textColor }}
          >
            Aa
          </span>
        )}
        
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}

        {/* Premium badge (for future use) */}
        {theme.isPremium && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 rounded text-[10px] font-bold text-white">
            PRO
          </div>
        )}
      </div>

      {/* Accent color bar */}
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: theme.thumbnail.accentBar }}
      />

      {/* Theme name */}
      <div className="p-2 bg-card">
        <p className="text-xs font-medium text-foreground text-center truncate">
          {theme.name}
        </p>
      </div>
    </button>
  );
}
