import { useEffect, useRef } from "react";
import { GA_REGEX, PIXEL_REGEX } from "@/hooks/useIntegrations";

interface IntegrationScriptsProps {
  gaMeasurementId?: string | null;
  metaPixelId?: string | null;
}

// Extend Window interface for gtag and fbq
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export function IntegrationScripts({
  gaMeasurementId,
  metaPixelId,
}: IntegrationScriptsProps) {
  const scriptsLoadedRef = useRef({
    ga: false,
    pixel: false,
  });

  // Google Analytics 4
  useEffect(() => {
    // Defesa em profundidade: revalida mesmo que a escrita original já tenha validado
    // (dado antigo/corrompido no banco não deve virar script injetado).
    if (!gaMeasurementId || !GA_REGEX.test(gaMeasurementId) || scriptsLoadedRef.current.ga) return;
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
    if (!metaPixelId || !PIXEL_REGEX.test(metaPixelId) || scriptsLoadedRef.current.pixel) return;
    scriptsLoadedRef.current.pixel = true;

    // Meta Pixel initialization
    const f = window;
    const b = document;
    const e = "script";

    if (f.fbq) return;

    const n = (f.fbq = function (...args: unknown[]) {
      if (typeof n.callMethod === "function") {
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

    n("init", metaPixelId);
    n("track", "PageView");

    return () => {
      t.remove();
    };
  }, [metaPixelId]);

  return null;
}
