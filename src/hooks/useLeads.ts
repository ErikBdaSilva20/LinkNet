import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "@/hooks/use-toast";
import { listLeads, removeLead, type Lead } from "@/lib/data/leads.repo";

export function useLeads() {
  const { pageId } = useActivePage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // list-then-filter: modo genérico não tem filtro server-side (§B5)
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["leads", pageId],
    queryFn: async (): Promise<Lead[]> => {
      if (!pageId) return [];
      const all = await listLeads();
      return all
        .filter((l) => l.page_id === pageId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    enabled: !!pageId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await removeLead(leadId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", pageId] });
      toast({ title: "Lead removido" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export CSV
  const exportCSV = () => {
    if (!leads?.length) {
      toast({ title: "Nenhum lead para exportar" });
      return;
    }

    // Collect all custom field keys across leads
    const customFieldKeys = new Set<string>();
    leads.forEach((l) => {
      Object.keys(l.custom_fields || {}).forEach((k) => customFieldKeys.add(k));
    });
    const customKeys = Array.from(customFieldKeys);

    const headers = ["Nome", "Email", "Telefone", ...customKeys, "Data de Cadastro"];
    const rows = leads.map((l) => {
      const cf = l.custom_fields || {};
      const email = l.email?.includes("@placeholder.local") ? "" : l.email;
      return [
        l.name || "",
        email,
        l.phone || "",
        ...customKeys.map((k) => cf[k] || ""),
        new Date(l.created_at).toLocaleString("pt-BR"),
      ];
    });

    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: `${leads.length} leads exportados` });
  };

  return {
    leads: leads || [],
    isLoading,
    error,
    deleteLead: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    exportCSV,
    totalLeads: leads?.length || 0,
  };
}
