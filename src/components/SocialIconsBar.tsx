import { useMemo } from "react";
import { DynamicIcon } from "@/components/IconSelector";
import { detectSocialPlatform } from "@/utils/socialDetection";

interface LinkWithUrl {
  id: string;
  url: string | null;
  link_type?: "link" | "header";
}

interface SocialIconsBarProps {
  links: LinkWithUrl[];
  accentColor: string;
  textColor: string;
  onClickLink?: (linkId: string) => void;
  maxIcons?: number;
}

export function SocialIconsBar({
  links,
  accentColor,
  textColor,
  onClickLink,
  maxIcons = 8,
}: SocialIconsBarProps) {
  // Filter links that are known social platforms
  const socialLinks = useMemo(() => {
    return links
      .filter((link) => {
        // Skip headers
        if (link.link_type === "header") return false;
        // Check if it's a social platform
        return detectSocialPlatform(link.url) !== null;
      })
      .slice(0, maxIcons);
  }, [links, maxIcons]);

  // Don't render if no social links found
  if (socialLinks.length === 0) return null;

  const handleClick = (link: LinkWithUrl, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Track the click (fire-and-forget)
    onClickLink?.(link.id);
    
    // Open in new tab
    if (link.url) {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex justify-center gap-3 flex-wrap mt-4">
      {socialLinks.map((link) => {
        const platform = detectSocialPlatform(link.url);
        if (!platform) return null;

        return (
          <a
            key={link.id}
            href={link.url || "#"}
            onClick={(e) => handleClick(link, e)}
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}10`,
              color: textColor,
            }}
            title={platform.name}
            aria-label={platform.name}
          >
            <DynamicIcon name={platform.iconName} className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}

// Simplified version for MobilePreview (no click tracking)
interface SocialIconsBarPreviewProps {
  links: Array<{ id: string; url?: string | null; link_type?: "link" | "header" }>;
  accentColor: string;
  textColor: string;
}

export function SocialIconsBarPreview({
  links,
  accentColor,
  textColor,
}: SocialIconsBarPreviewProps) {
  const socialLinks = useMemo(() => {
    return links
      .filter((link) => {
        if (link.link_type === "header") return false;
        return detectSocialPlatform(link.url) !== null;
      })
      .slice(0, 6); // Fewer icons in preview
  }, [links]);

  if (socialLinks.length === 0) return null;

  return (
    <div className="flex justify-center gap-2 flex-wrap mt-3">
      {socialLinks.map((link) => {
        const platform = detectSocialPlatform(link.url);
        if (!platform) return null;

        return (
          <div
            key={link.id}
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}10`,
              color: textColor,
            }}
          >
            <DynamicIcon name={platform.iconName} className="h-4 w-4" />
          </div>
        );
      })}
    </div>
  );
}
