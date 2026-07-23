import { cn } from "@/lib/utils";
import {
  Image,
  Type, 
  ToggleLeft, 
  Droplet,
  Sparkles,
  UserCircle
} from "lucide-react";

export type DesignSection = 
  | "header" 
  | "theme" 
  | "wallpaper" 
  | "text" 
  | "buttons" 
  | "colors";

interface DesignSidebarProps {
  activeSection: DesignSection;
  onSectionChange: (section: DesignSection) => void;
}

const DESIGN_SECTIONS: { id: DesignSection; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "header", name: "Cabeçalho", icon: UserCircle },
  { id: "theme", name: "Temas", icon: Sparkles },
  { id: "wallpaper", name: "Fundo", icon: Image },
  { id: "text", name: "Texto", icon: Type },
  { id: "buttons", name: "Botões", icon: ToggleLeft },
  { id: "colors", name: "Cores", icon: Droplet },
];

export function DesignSidebar({ activeSection, onSectionChange }: DesignSidebarProps) {
  return (
    <nav className="w-48 shrink-0">
      <div className="sticky top-6 space-y-1">
        {DESIGN_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {section.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
