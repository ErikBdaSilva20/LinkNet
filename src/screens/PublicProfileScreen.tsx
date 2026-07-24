import { useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DynamicIcon } from "@/components/IconSelector";
import { SEOHead } from "@/components/SEOHead";
import { IntegrationScripts } from "@/components/IntegrationScripts";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { parseFormFields } from "@/components/LeadFormFieldsConfigurator";
import { SocialIconsBar } from "@/components/SocialIconsBar";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { getFontFamily, getButtonRadius } from "@/hooks/useTheme";
import { ExternalLink, Loader2 } from "lucide-react";
import type { Tables } from "@/lib/data/types.gen";

type Link = Tables<"links">;

export default function PublicProfileScreen() {
  const { handle } = useParams<{ handle: string }>();
  const {
    page,
    links,
    theme,
    integrations,
    isLoading,
    error,
    trackClick,
  } = usePublicProfile(handle);

  // Generate full theme styles from database
  const themeStyles = useMemo(() => {
    if (!theme) {
      // Default theme
      return {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#ffffff",
        "--accent-color": "#22d3ee",
        "--button-radius": "16px",
        fontFamily: "'Inter', sans-serif",
      } as React.CSSProperties;
    }

    // Build background style based on type
    let backgroundStyle: React.CSSProperties = {};
    
    if (theme.background_type === "image" && theme.custom_background_url) {
      backgroundStyle = {
        backgroundImage: `url(${theme.custom_background_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    } else if (theme.background_type === "gradient" && theme.background_value) {
      backgroundStyle = { background: theme.background_value };
    } else {
      backgroundStyle = { backgroundColor: theme.background_value || "#0f172a" };
    }

    return {
      ...backgroundStyle,
      color: theme.text_color || "#ffffff",
      "--accent-color": theme.accent_color || "#22d3ee",
      "--button-radius": getButtonRadius(theme.button_style, theme.button_radius),
      fontFamily: getFontFamily(theme.font_family),
    } as React.CSSProperties;
  }, [theme]);

  // Get accent color for styling
  const accentColor = theme?.accent_color || "#22d3ee";
  const textColor = theme?.text_color || "#ffffff";
  const buttonRadius = theme ? getButtonRadius(theme.button_style, theme.button_radius) : "16px";

  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check if a link is an internal page link
  const isInternalPageLink = useCallback((link: Link) => {
    if (!link.url || !handle) return false;
    // Match /{handle} or /{handle}/{slug}
    const pattern = new RegExp(`^(https?://[^/]+)?/${handle}(/[^/]+)?$`);
    return pattern.test(link.url) || link.url.startsWith(`/${handle}`);
  }, [handle]);

  // Handle link click with tracking
  const handleLinkClick = (link: Link, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Fire-and-forget tracking (doesn't block navigation)
    trackClick(link.id);
    
    if (!link.url) return;

    // Internal page link: navigate in same tab with transition
    if (isInternalPageLink(link)) {
      setIsTransitioning(true);
      // Extract the path portion
      const path = link.url.startsWith("http") 
        ? new URL(link.url).pathname 
        : link.url;
      
      setTimeout(() => {
        navigate(path);
        setIsTransitioning(false);
      }, 300);
      return;
    }
    
    // External link: open in new tab
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
            <ExternalLink className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Perfil não encontrado
          </h1>
          <p className="text-muted-foreground">
            O usuário @{handle} não existe ou não está público.
          </p>
        </div>
      </div>
    );
  }

  const pageTitle = page.title || page.display_name || `@${handle}`;
  const pageDescription = page.description || page.bio || "";
  const pageImage = page.og_image_url || page.avatar_url;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        imageUrl={pageImage}
        url={currentUrl}
      />

      {/* Integration Scripts (GA4, Meta Pixel) */}
      <IntegrationScripts
        gaMeasurementId={integrations?.google_analytics_measurement_id}
        metaPixelId={integrations?.meta_pixel_id}
      />

      <div 
        className="min-h-screen w-full flex items-center justify-center p-4"
        style={themeStyles}
      >
        <div 
          className={`w-full max-w-md space-y-8 transition-all duration-300 ${
            isTransitioning ? "opacity-0 scale-95" : "animate-fade-in opacity-100 scale-100"
          }`}
        >
          {/* Profile Header */}
          <div className="text-center space-y-4">
            {/* Avatar */}
            <div 
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden"
              style={{ 
                backgroundColor: accentColor,
                color: textColor,
                boxShadow: `0 10px 40px -10px ${accentColor}50`
              }}
            >
              {page.avatar_url ? (
                <img
                  src={page.avatar_url}
                  alt={page.display_name || handle}
                  className="w-full h-full object-cover"
                />
              ) : (
                page.display_name?.charAt(0) || handle?.charAt(0) || "U"
              )}
            </div>

            {/* Name & Bio */}
            <div>
              <h1 className="text-2xl font-bold">
                {page.display_name || `@${handle}`}
              </h1>
              {page.bio && (
                <p className="mt-2 max-w-sm mx-auto opacity-70">
                  {page.bio}
                </p>
              )}
            </div>

            {/* Social Icons Bar */}
            <SocialIconsBar
              links={links}
              accentColor={accentColor}
              textColor={textColor}
              onClickLink={trackClick}
            />
          </div>

          {/* Lead Capture Form */}
          {page.lead_form_enabled && (
            <LeadCaptureForm
              pageId={page.id}
              title={page.lead_form_title || "Fique por dentro"}
              description={page.lead_form_description || "Cadastre seu e-mail para receber novidades"}
              accentColor={accentColor}
              textColor={textColor}
              buttonRadius={buttonRadius}
              fields={parseFormFields(page.lead_form_fields)}
            />
          )}

          {/* Links */}
          {links.length > 0 ? (
            <div className="space-y-4">
              {links.map((link) => {
                const isHeader = link.link_type === "header";
                
                // Render header as section title
                if (isHeader) {
                  return (
                    <div 
                      key={link.id} 
                      className="pt-4 first:pt-0"
                    >
                      <h2 
                        className="text-center font-semibold text-lg opacity-80"
                        style={{ color: textColor }}
                      >
                        {link.title}
                      </h2>
                    </div>
                  );
                }
                
                // Render regular link
                return (
                  <a
                    key={link.id}
                    href={link.url || "#"}
                    onClick={(e) => handleLinkClick(link, e)}
                    className="group block"
                  >
                    <div 
                      className="flex items-center gap-4 p-4 border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
                      style={{ 
                        borderRadius: buttonRadius,
                        borderColor: `${accentColor}40`,
                        backgroundColor: `${accentColor}15`,
                      }}
                    >
                      {/* Thumbnail/Icon */}
                      {link.thumbnail_type === "upload" && link.thumbnail_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={link.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : link.thumbnail_type === "icon" && link.icon_name ? (
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ 
                            backgroundColor: `${accentColor}20`,
                            color: accentColor
                          }}
                        >
                          <DynamicIcon
                            name={link.icon_name}
                            className="h-6 w-6"
                          />
                        </div>
                      ) : link.thumbnail_type === "icon" && link.thumbnail_url ? (
                        /* Custom uploaded icon */
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ 
                            backgroundColor: `${accentColor}20`,
                          }}
                        >
                          <img
                            src={link.thumbnail_url}
                            alt=""
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : null}

                      {/* Title */}
                      <span className="flex-1 text-center font-medium">
                        {link.title}
                      </span>

                      {/* Featured indicator */}
                      {link.is_featured && (
                        <span 
                          className="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: `${accentColor}30`,
                            color: accentColor
                          }}
                        >
                          ⭐
                        </span>
                      )}

                      {/* External icon - only for external links */}
                      {!isInternalPageLink(link) && (
                        <ExternalLink 
                          className="h-4 w-4 transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100" 
                        />
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="opacity-60">
                Nenhum link disponível ainda.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-8">
            <p className="text-xs opacity-50">
              Powered by{" "}
              <span className="font-semibold" style={{ color: accentColor }}>LinkGuild</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
