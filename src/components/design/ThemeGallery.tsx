import { ThemeCard } from "./ThemeCard";
import type { CuratedTheme } from "@/data/curatedThemes";

interface ThemeGalleryProps {
  themes: CuratedTheme[];
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export function ThemeGallery({ themes, selectedThemeId, onSelectTheme }: ThemeGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isSelected={selectedThemeId === theme.id}
          onSelect={() => onSelectTheme(theme.id)}
        />
      ))}
    </div>
  );
}
