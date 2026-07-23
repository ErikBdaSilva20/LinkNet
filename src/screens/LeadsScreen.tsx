import { useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { Download, Trash2, Users, Loader2, Mail, Calendar, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LeadsScreen() {
  const { leads, isLoading, deleteLead, isDeleting, exportCSV, totalLeads } = useLeads();

  // Collect all unique custom field keys across leads
  const customFieldKeys = useMemo(() => {
    const keys = new Set<string>();
    leads.forEach((lead) => {
      Object.keys(lead.custom_fields || {}).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [leads]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os e-mails capturados pelo formulário público
            </p>
          </div>
          
          {totalLeads > 0 && (
            <Button 
              onClick={exportCSV}
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Stats Card */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Leads</p>
              <p className="text-3xl font-bold text-foreground">{totalLeads}</p>
            </div>
          </div>
        </GlassCard>

        {/* Leads Table */}
        <GlassCard className="p-0 overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum lead ainda
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Quando visitantes se cadastrarem pelo formulário da sua página pública, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
                    <TableHead className="text-muted-foreground font-medium">E-mail</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Telefone</TableHead>
                    {customFieldKeys.map((key) => (
                      <TableHead key={key} className="text-muted-foreground font-medium">{key}</TableHead>
                    ))}
                    <TableHead className="text-muted-foreground font-medium">Data</TableHead>
                    <TableHead className="text-muted-foreground font-medium w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    return (
                      <TableRow
                        key={lead.id} 
                        className="border-border/50 hover:bg-muted/30"
                      >
                        <TableCell className="font-medium text-foreground">
                          {lead.name || (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {lead.email?.includes("@placeholder.local") ? (
                              <span className="text-muted-foreground italic">—</span>
                            ) : lead.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {lead.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {lead.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                        {customFieldKeys.map((key) => {
                          const val = lead.custom_fields?.[key];
                          return (
                            <TableCell key={key} className="text-foreground">
                              {val || <span className="text-muted-foreground italic">—</span>}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(lead.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover lead?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O lead será permanentemente removido.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteLead(lead.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Remover"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCard>

        {/* Help text */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Dica:</strong> Para ativar o formulário de captura na sua página pública, vá em{" "}
            <span className="text-primary font-medium">Formulário</span> no menu lateral.
          </p>
        </div>
      </div>
  );
}
