// Domínio de "campos do formulário de captura de lead" (pages.lead_form_fields, jsonb).
// Extraído de LeadFormFieldsConfigurator.tsx: parsing/validação não tem relação com o editor
// drag-and-drop — é lido também por PublicProfileScreen (render público) e LinksScreen
// (preview), então não deveria morar dentro de um arquivo de componente de UI.

export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "date";
  label: string;
  enabled: boolean;
  required: boolean;
}

export const DEFAULT_LEAD_FORM_FIELDS: FormField[] = [
  { id: "name", type: "text", label: "Nome", enabled: true, required: false },
  { id: "email", type: "email", label: "E-mail", enabled: true, required: true },
];

export function parseFormFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return DEFAULT_LEAD_FORM_FIELDS;
  try {
    return raw.map((f: Record<string, unknown>) => ({
      id: String(f.id || crypto.randomUUID()),
      type: (["text", "email", "phone", "date"].includes(f.type as string) ? f.type : "text") as FormField["type"],
      label: String(f.label || ""),
      enabled: Boolean(f.enabled),
      required: Boolean(f.required),
    }));
  } catch {
    return DEFAULT_LEAD_FORM_FIELDS;
  }
}
