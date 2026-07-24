import { useMemo, useState } from "react";
import { getFontFamily, getButtonRadius } from "@/hooks/useTheme";
import { getBackgroundStyle, getLinkButtonStyle } from "@/lib/publicPageStyle";
import { SocialIconsBarPreview } from "@/components/SocialIconsBar";
import type { Database } from "@/lib/data/types.gen";
import type { FormField } from "@/lib/leadFormFields";

type BackgroundType = Database["public"]["Enums"]["background_type"];

interface ThemeData {
  background_type: BackgroundType;
  background_value: string | null;
  custom_background_url: string | null;
  text_color: string | null;
  accent_color: string | null;
  font_family: string;
  button_style: string;
  button_radius: number;
}

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface LinkData {
  id: string;
  title: string;
  url?: string | null;
  link_type?: "link" | "header";
}

interface LeadFormData {
  enabled: boolean;
  title: string;
  description: string;
  fields?: FormField[];
}

interface MobilePreviewProps {
  theme: ThemeData;
  profile?: ProfileData | null;
  links?: LinkData[];
  leadForm?: LeadFormData | null;
}

const MOCK_LINKS: LinkData[] = [
  { id: "1", title: "Meu Site", url: "https://meusite.com", link_type: "link" },
  { id: "2", title: "Instagram", url: "https://instagram.com/user", link_type: "link" },
  { id: "3", title: "YouTube", url: "https://youtube.com/@channel", link_type: "link" },
  { id: "4", title: "Loja Online", url: "https://loja.com", link_type: "link" },
];


function LeadFormMiniPreview({ 
  leadForm, accentColor, textColor, buttonRadius 
}: { 
  leadForm: LeadFormData; 
  accentColor: string; 
  textColor: string; 
  buttonRadius: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeFields = (leadForm.fields || []).filter(f => f.enabled);

  return (
    <div
      className="rounded-xl border-2 mb-4 overflow-hidden transition-all duration-300"
      style={{
        borderColor: `${accentColor}40`,
        backgroundColor: `${accentColor}10`,
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 text-left"
        style={{ color: textColor }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}30` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] font-bold leading-tight truncate">{leadForm.title || "Fique por dentro"}</h4>
          <p className="text-[8px] opacity-50 leading-tight truncate">{leadForm.description || "Cadastre seu e-mail"}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 opacity-50 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: isOpen ? "300px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-3 pb-3 space-y-1.5">
          {activeFields.map((field, i) => (
            <div
              key={field.id}
              className="h-6 border px-2 flex items-center text-[9px] opacity-50 transition-all duration-200"
              style={{
                borderColor: `${textColor}20`,
                backgroundColor: `${textColor}08`,
                color: textColor,
                borderRadius: buttonRadius,
                transitionDelay: isOpen ? `${i * 50}ms` : "0ms",
                opacity: isOpen ? 0.5 : 0,
                transform: isOpen ? "translateY(0)" : "translateY(-4px)",
              }}
            >
              {field.label}{!field.required && " (opcional)"}
            </div>
          ))}
          <div
            className="h-6 flex items-center justify-center text-[9px] font-medium transition-all duration-200"
            style={{
              backgroundColor: accentColor,
              color: textColor,
              borderRadius: buttonRadius,
              transitionDelay: isOpen ? `${activeFields.length * 50}ms` : "0ms",
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateY(0)" : "translateY(-4px)",
            }}
          >
            Cadastrar
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobilePreview({ theme, profile, links, leadForm }: MobilePreviewProps) {
  const backgroundStyle = useMemo(() => getBackgroundStyle(theme), [theme]);

  const buttonRadius = useMemo(() => {
    return getButtonRadius(theme.button_style, theme.button_radius);
  }, [theme.button_style, theme.button_radius]);

  const fontFamily = useMemo(() => {
    return getFontFamily(theme.font_family);
  }, [theme.font_family]);

  const textColor = theme.text_color || "#ffffff";
  const accentColor = theme.accent_color || "#22d3ee";
  const displayLinks = links && links.length > 0 ? links.slice(0, 5) : MOCK_LINKS;

  return (
    <div className="mx-auto" style={{ width: 280 }}>
      {/* Phone Frame */}
      <div className="relative rounded-[2.5rem] bg-gray-800 p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-10" />

        {/* Screen */}
        <div
          className="rounded-[2rem] overflow-hidden"
          style={{ height: 520 }}
        >
          <div
            className="w-full h-full overflow-y-auto p-6 pt-8"
            style={{
              ...backgroundStyle,
              color: textColor,
              fontFamily,
            }}
          >
            {/* Avatar */}
            <div className="text-center mb-6">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold overflow-hidden"
                style={{ backgroundColor: accentColor }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span style={{ color: textColor }}>
                    {profile?.display_name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold">
                {profile?.display_name || "@usuario"}
              </h2>
              <p className="text-sm opacity-70 mt-1">
                {profile?.bio || "Sua bio aqui"}
              </p>

              {/* Social Icons Preview */}
              <SocialIconsBarPreview
                links={displayLinks}
                accentColor={accentColor}
                textColor={textColor}
              />
            </div>

            {/* Lead Form Preview */}
            {leadForm?.enabled && (
              <LeadFormMiniPreview
                leadForm={leadForm}
                accentColor={accentColor}
                textColor={textColor}
                buttonRadius={buttonRadius}
              />
            )}

            {/* Links */}
            <div className="space-y-3">
              {displayLinks.map((link) => {
                // Render header as section title
                if (link.link_type === "header") {
                  return (
                    <div key={link.id} className="pt-2 first:pt-0">
                      <h3 
                        className="text-center font-semibold text-sm opacity-80"
                        style={{ color: textColor }}
                      >
                        {link.title}
                      </h3>
                    </div>
                  );
                }
                
                // Render regular link
                return (
                  <div
                    key={link.id}
                    className="p-3 text-center font-medium border-2 transition-all cursor-pointer hover:scale-[1.02]"
                    style={{ ...getLinkButtonStyle(accentColor, buttonRadius), color: textColor }}
                  >
                    {link.title}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-xs opacity-50">
                Powered by LinkGuild
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}