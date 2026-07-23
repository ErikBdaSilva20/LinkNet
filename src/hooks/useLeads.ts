import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useToast } from "@/hooks/use-toast";

export function useLeads() {
  const { pageId } = useActivePage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch leads
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["leads", pageId],
    queryFn: async () => {
      if (!pageId) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId,
  });

  // Delete lead
  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", pageId] });
      toast({ title: "Lead removido" });
    },
    onError: (error) => {
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
    leads.forEach(l => {
      const cf = (l as typeof l & { custom_fields?: Record<string, string> }).custom_fields;
      if (cf && typeof cf === "object") {
        Object.keys(cf).forEach(k => customFieldKeys.add(k));
      }
    });
    const customKeys = Array.from(customFieldKeys);

    const headers = ["Nome", "Email", "Telefone", ...customKeys, "Data de Cadastro"];
    const rows = leads.map(l => {
      const cf = (l as typeof l & { custom_fields?: Record<string, string> }).custom_fields || {};
      const phone = (l as typeof l & { phone?: string }).phone || "";
      const email = l.email?.includes("@placeholder.local") ? "" : l.email;
      return [
        l.name || "",
        email,
        phone,
        ...customKeys.map(k => (cf as Record<string, string>)[k] || ""),
        new Date(l.created_at).toLocaleString("pt-BR"),
      ];
    });

    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
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
