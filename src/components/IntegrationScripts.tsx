import { useEffect, useRef } from "react";

interface IntegrationScriptsProps {
  gaMeasurementId?: string | null;
  metaPixelId?: string | null;
  customHeadHtml?: string | null;
}

// Allowed tags for custom HTML (security)
const ALLOWED_TAGS = ["LINK", "META", "STYLE"];
const DANGEROUS_ATTRS = [
  "onclick", "onerror", "onload", "onmouseover", "onmouseout",
  "onfocus", "onblur", "onsubmit", "onreset", "onchange",
  "onkeydown", "onkeyup", "onkeypress"
];

// Sanitize custom HTML to prevent XSS
const sanitizeHeadHtml = (html: string): DocumentFragment => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<head>${html}</head>`, "text/html");
  const fragment = document.createDocumentFragment();

  doc.head.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      
      // Only allow safe tags
      if (!ALLOWED_TAGS.includes(el.tagName)) return;
      
      // Remove dangerous attributes
      DANGEROUS_ATTRS.forEach((attr) => el.removeAttribute(attr));
      
      // Clone and add to fragment
      fragment.appendChild(el.cloneNode(true));
    }
  });

  return fragment;
};

// Extend Window interface for gtag and fbq
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export function IntegrationScripts({
  gaMeasurementId,
  metaPixelId,
  customHeadHtml,
}: IntegrationScriptsProps) {
  const scriptsLoadedRef = useRef({
    ga: false,
    pixel: false,
    custom: false,
  });

  // Google Analytics 4
  useEffect(() => {
    if (!gaMeasurementId || scriptsLoadedRef.current.ga) return;
    scriptsLoadedRef.current.ga = true;

    // Load gtag.js
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaMeasurementId);

    return () => {
      // Cleanup script on unmount
      script.remove();
    };
  }, [gaMeasurementId]);

  // Meta Pixel
  useEffect(() => {
    if (!metaPixelId || scriptsLoadedRef.current.pixel) return;
    scriptsLoadedRef.current.pixel = true;

    // Meta Pixel initialization
    const f = window;
    const b = document;
    const e = "script";
    
    if (f.fbq) return;
    
    const n = (f.fbq = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    }) as typeof window.fbq & { 
      callMethod?: (...args: unknown[]) => void; 
      queue: unknown[][]; 
      push: (args: unknown[]) => void;
      loaded: boolean;
      version: string;
    };
    
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);

    window.fbq("init", metaPixelId);
    window.fbq("track", "PageView");

    return () => {
      t.remove();
    };
  }, [metaPixelId]);

  // Custom Head HTML
  useEffect(() => {
    if (!customHeadHtml || scriptsLoadedRef.current.custom) return;
    scriptsLoadedRef.current.custom = true;

    try {
      const fragment = sanitizeHeadHtml(customHeadHtml);
      const addedNodes: Node[] = [];

      fragment.childNodes.forEach((node) => {
        const cloned = node.cloneNode(true);
        document.head.appendChild(cloned);
        addedNodes.push(cloned);
      });

      return () => {
        addedNodes.forEach((node) => {
          if (node.parentNode === document.head) {
            document.head.removeChild(node);
          }
        });
      };
    } catch (error) {
      console.error("Error parsing custom head HTML:", error);
    }
  }, [customHeadHtml]);

  return null;
}
