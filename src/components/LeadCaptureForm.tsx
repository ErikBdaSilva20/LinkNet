import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Mail, ChevronDown } from "lucide-react";
import type { FormField } from "@/components/LeadFormFieldsConfigurator";
import { submitLead } from "@/lib/data/public.repo";

interface LeadCaptureFormProps {
  pageId: string;
  title: string;
  description: string;
  accentColor: string;
  textColor: string;
  buttonRadius: string;
  fields?: FormField[];
}

const DEFAULT_FIELDS: FormField[] = [
  { id: "name", type: "text", label: "Nome", enabled: true, required: false },
  { id: "email", type: "email", label: "E-mail", enabled: true, required: true },
];

export function LeadCaptureForm({ 
  pageId, 
  title, 
  description, 
  accentColor, 
  textColor,
  buttonRadius,
  fields,
}: LeadCaptureFormProps) {
  const activeFields = (fields && fields.length > 0 ? fields : DEFAULT_FIELDS).filter(f => f.enabled);
  
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSubmitRef = useRef(0);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const setValue = (id: string, value: string, type: string) => {
    const formatted = type === "phone" ? formatPhone(value) : value;
    setValues(prev => ({ ...prev, [id]: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const now = Date.now();
    if (now - lastSubmitRef.current < 10000) {
      setError("Aguarde alguns segundos antes de tentar novamente.");
      return;
    }

    for (const field of activeFields) {
      if (field.required && !values[field.id]?.trim()) {
        setError(`${field.label} é obrigatório`);
        return;
      }
    }

    const emailField = activeFields.find(f => f.type === "email");
    if (emailField && values[emailField.id]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedEmail = values[emailField.id].trim();
      if (!emailRegex.test(trimmedEmail)) {
        setError("E-mail inválido");
        return;
      }
      if (trimmedEmail.length > 255) {
        setError("E-mail muito longo");
        return;
      }
    }

    setIsSubmitting(true);
    lastSubmitRef.current = now;

    try {
      const payload: Record<string, unknown> = { page_id: pageId };
      
      for (const field of activeFields) {
        const val = values[field.id]?.trim() || null;
        if (field.id === "name") payload.name = val;
        else if (field.id === "email") payload.email = val;
        else if (field.id === "phone") payload.phone = val;
        else {
          if (!payload.custom_fields) payload.custom_fields = {};
          (payload.custom_fields as Record<string, unknown>)[field.label] = val;
        }
      }

      await submitLead(payload as { page_id: string } & Record<string, unknown>);

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div 
        className="text-center p-6 rounded-2xl border-2 backdrop-blur-sm"
        style={{
          borderColor: `${accentColor}40`,
          backgroundColor: `${accentColor}10`,
          color: textColor,
        }}
      >
        <div 
          className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}30` }}
        >
          <Check className="h-6 w-6" style={{ color: accentColor }} />
        </div>
        <p className="font-medium text-lg">Cadastro realizado!</p>
        <p className="text-sm opacity-70 mt-1">Você receberá nossas novidades.</p>
      </div>
    );
  }

  const getInputType = (type: string) => {
    switch (type) {
      case "email": return "email";
      case "phone": return "tel";
      case "date": return "date";
      default: return "text";
    }
  };

  return (
    <div
      className="rounded-2xl border-2 backdrop-blur-sm overflow-hidden transition-all duration-300"
      style={{
        borderColor: `${accentColor}40`,
        backgroundColor: `${accentColor}10`,
        color: textColor,
      }}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 transition-colors duration-200"
        style={{ color: textColor }}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}30` }}
        >
          <Mail className="h-5 w-5" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-base font-bold leading-tight">{title}</h3>
          <p className="text-xs opacity-60 leading-tight mt-0.5">{description}</p>
        </div>
        <ChevronDown 
          className="h-5 w-5 flex-shrink-0 transition-transform duration-300 opacity-60"
          style={{ 
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: textColor 
          }} 
        />
      </button>

      {/* Expandable Form */}
      <div
        className="transition-all duration-400 ease-in-out overflow-hidden"
        style={{
          maxHeight: isOpen ? "500px" : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <form 
          onSubmit={handleSubmit} 
          className="px-4 pb-4 space-y-3"
        >
          <div className="space-y-3">
            {activeFields.map((field, index) => (
              <div
                key={field.id}
                className="transition-all duration-300"
                style={{
                  transitionDelay: isOpen ? `${index * 60}ms` : "0ms",
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? "translateY(0)" : "translateY(-8px)",
                }}
              >
                <Input
                  type={getInputType(field.type)}
                  placeholder={field.label + (field.required ? "" : " (opcional)")}
                  value={values[field.id] || ""}
                  onChange={(e) => setValue(field.id, e.target.value, field.type)}
                  required={field.required}
                  maxLength={field.type === "email" ? 255 : field.type === "phone" ? 15 : 100}
                  className="bg-white/10 border-white/20 placeholder:text-white/40 focus-visible:ring-offset-0"
                  style={{
                    color: textColor,
                    borderRadius: buttonRadius,
                  }}
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}

          <div
            className="transition-all duration-300"
            style={{
              transitionDelay: isOpen ? `${activeFields.length * 60}ms` : "0ms",
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateY(0)" : "translateY(-8px)",
            }}
          >
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full font-medium transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: accentColor,
                color: textColor,
                borderRadius: buttonRadius,
              }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
