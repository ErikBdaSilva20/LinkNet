import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  imageUrl?: string | null;
  url?: string;
}

export function SEOHead({ title, description, imageUrl, url }: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    const originalTitle = document.title;
    document.title = title;

    // Helper to set or create meta tags
    const setMeta = (name: string, content: string, isProperty = false) => {
      if (!content) return null;
      
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      
      el.setAttribute("content", content);
      return el;
    };

    // Track created elements for cleanup
    const createdElements: HTMLElement[] = [];

    // Standard meta tags
    const descEl = setMeta("description", description || "");
    if (descEl) createdElements.push(descEl);

    // Open Graph tags
    const ogTitle = setMeta("og:title", title, true);
    if (ogTitle) createdElements.push(ogTitle);

    const ogDesc = setMeta("og:description", description || "", true);
    if (ogDesc) createdElements.push(ogDesc);

    // data: URI não é aceito por plataformas de preview social (esperam URL http(s)
    // buscável separadamente) — omitir a tag em vez de publicar um valor garantidamente inútil.
    const isDataUri = imageUrl?.startsWith("data:") ?? false;
    const publicImageUrl = isDataUri ? "" : imageUrl || "";

    const ogImage = setMeta("og:image", publicImageUrl, true);
    if (ogImage) createdElements.push(ogImage);

    const ogType = setMeta("og:type", "profile", true);
    if (ogType) createdElements.push(ogType);

    if (url) {
      const ogUrl = setMeta("og:url", url, true);
      if (ogUrl) createdElements.push(ogUrl);
    }

    // Twitter Card tags
    const twitterCard = setMeta("twitter:card", publicImageUrl ? "summary_large_image" : "summary");
    if (twitterCard) createdElements.push(twitterCard);

    const twitterTitle = setMeta("twitter:title", title);
    if (twitterTitle) createdElements.push(twitterTitle);

    const twitterDesc = setMeta("twitter:description", description || "");
    if (twitterDesc) createdElements.push(twitterDesc);

    if (publicImageUrl) {
      const twitterImage = setMeta("twitter:image", publicImageUrl);
      if (twitterImage) createdElements.push(twitterImage);
    }

    // Cleanup on unmount
    return () => {
      document.title = originalTitle;
      // Note: We don't remove meta tags as they may be used by other components
      // Instead, they will be updated when navigating to another page
    };
  }, [title, description, imageUrl, url]);

  return null;
}
