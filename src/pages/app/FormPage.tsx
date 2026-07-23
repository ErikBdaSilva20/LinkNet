import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Mail, Save, Loader2 } from "lucide-react";
import { LeadFormFieldsConfigurator, parseFormFields, type FormField } from "@/components/LeadFormFieldsConfigurator";
import { useActivePage } from "@/contexts/ActivePageContext";
import { usePages } from "@/hooks/usePages";

export default function FormPage() {
  const { page, isLoading: isLoadingPage } = useActivePage();
  const { updatePage, isUpdating: isUpdatingPage } = usePages();

  const [leadFormEnabled, setLeadFormEnabled] = useState(false);
  const [leadFormTitle, setLeadFormTitle] = useState("Fique por dentro");
  const [leadFormDescription, setLeadFormDescription] = useState("Cadastre seu e-mail para receber novidades");
  const [leadFormFields, setLeadFormFields] = useState<FormField[]>([
    { id: "name", type: "text", label: "Nome", enabled: true, required: false },
    { id: "email", type: "email", label: "E-mail", enabled: true, required: true },
  ]);

  useEffect(() => {
    if (page) {
      const pageData = page as typeof page & {
        lead_form_enabled?: boolean;
        lead_form_title?: string;
        lead_form_description?: string;
        lead_form_fields?: unknown;
      };
      setLeadFormEnabled(pageData.lead_form_enabled || false);
      setLeadFormTitle(pageData.lead_form_title || "Fique por dentro");
      setLeadFormDescription(pageData.lead_form_description || "Cadastre seu e-mail para receber novidades");
      setLeadFormFields(parseFormFields(pageData.lead_form_fields));
    }
  }, [page]);

  const handleSave = () => {
    if (page?.id) {
      updatePage({
        pageId: page.id,
        updates: {
          lead_form_enabled: leadFormEnabled,
          lead_form_title: leadFormTitle,
          lead_form_description: leadFormDescription,
          lead_form_fields: leadFormFields,
        } as Record<string, unknown>,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Formulário</h1>
          <p className="text-muted-foreground mt-1">
            Configure o formulário de captura de leads da sua página
          </p>
        </div>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Formulário de Captura
            </h3>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Ative um formulário na sua página pública para capturar e-mails de visitantes interessados.
          </p>

          <div className="space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-foreground">Exibir formulário</Label>
                <p className="text-xs text-muted-foreground">
                  Mostra o formulário acima dos links
                </p>
              </div>
              <Switch
                checked={leadFormEnabled}
                onCheckedChange={setLeadFormEnabled}
              />
            </div>

            {leadFormEnabled && (
              <>
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="leadFormTitle">Título</Label>
                  <Input
                    id="leadFormTitle"
                    value={leadFormTitle}
                    onChange={(e) => setLeadFormTitle(e.target.value)}
                    className="input-styled"
                    placeholder="Fique por dentro"
                    maxLength={50}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="leadFormDescription">Descrição</Label>
                  <Textarea
                    id="leadFormDescription"
                    value={leadFormDescription}
                    onChange={(e) => setLeadFormDescription(e.target.value)}
                    className="input-styled min-h-20 resize-none"
                    placeholder="Cadastre seu e-mail para receber novidades"
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {leadFormDescription.length}/150
                  </p>
                </div>

                {/* Form Fields Configurator */}
                <LeadFormFieldsConfigurator
                  fields={leadFormFields}
                  onChange={setLeadFormFields}
                />
              </>
            )}

            <Button
              onClick={handleSave}
              disabled={isUpdatingPage}
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              {isUpdatingPage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Formulário
            </Button>
          </div>
        </GlassCard>

        {/* Hint */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Dica:</strong> Os leads capturados aparecerão na aba{" "}
            <span className="text-primary font-medium">Leads</span> do menu lateral.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
