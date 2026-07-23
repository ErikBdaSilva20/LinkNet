import { useState } from "react";
import { useActivePage } from "@/contexts/ActivePageContext";
import { CreatePageModal } from "./CreatePageModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Plus, FileText } from "lucide-react";

export function PageSelector() {
  const { page, pages, setActivePage } = useActivePage();
  const [modalOpen, setModalOpen] = useState(false);

  const getPageDisplayName = (p: typeof page) => {
    if (!p) return "Selecionar página";
    return p.title || p.handle;
  };

  const getPageUrl = (p: typeof page) => {
    if (!p) return "";
    return `/${p.handle}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2 h-10 px-3 bg-background/50 border-border/50"
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium">
                {getPageDisplayName(page)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {pages.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => setActivePage(p.id)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {p.title || p.handle}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {getPageUrl(p)}
                </span>
              </div>
              {p.id === page?.id && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setModalOpen(true)}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Nova Página
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreatePageModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
