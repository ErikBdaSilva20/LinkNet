// PROTEGIDO — não editável pela IA (masi.template.json, editable.protect).
// Dados mock usados pelo editor por IA (preview Sandpack) quando window.__MASI_PREVIEW__ = true.
// Cobertura completa por tabela (Bloco 7, Story 7.2): cada tabela de negócio tem pelo menos um
// registro de exemplo, para que o preview nunca renderize as telas no estado vazio.

import type { Database } from "./types.gen";

type Page = Database["public"]["Tables"]["pages"]["Row"];
type Link = Database["public"]["Tables"]["links"]["Row"];
type Theme = Database["public"]["Tables"]["themes"]["Row"];
type Integration = Database["public"]["Tables"]["integrations"]["Row"];
type Lead = Database["public"]["Tables"]["leads"]["Row"];
type ShortLink = Database["public"]["Tables"]["short_links"]["Row"];
type LinkClick = Database["public"]["Tables"]["link_clicks"]["Row"];
type PageView = Database["public"]["Tables"]["page_views"]["Row"];

const PREVIEW_OWNER_ID = "preview-owner-1";
const PREVIEW_PAGE_ID = "preview-page-1";

// PNG transparente 1x1 — placeholder curto pra campos que guardam imagem como base64 (Decisão
// travada: sem storage bucket, ver Importantdoc.md).
const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export const previewProfile: Page[] = [
  {
    id: PREVIEW_PAGE_ID,
    owner_id: PREVIEW_OWNER_ID,
    handle: "preview_user",
    display_name: "Preview User",
    bio: "Bio de exemplo pro preview do editor.",
    avatar_url: PLACEHOLDER_IMAGE,
    is_public: true,
    title: "Preview User — Link-in-bio",
    description: "Página de exemplo usada só no preview do editor por IA.",
    og_image_url: PLACEHOLDER_IMAGE,
    custom_domain: null,
    lead_form_enabled: true,
    lead_form_title: "Fique por dentro",
    lead_form_description: "Cadastre seu e-mail para receber novidades",
    lead_form_fields: [
      { id: "name", type: "text", label: "Nome", enabled: true, required: false },
      { id: "email", type: "email", label: "E-mail", enabled: true, required: true },
    ],
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
  },
];

export const previewLinks: Link[] = [
  {
    id: "preview-link-1",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    title: "Meu site",
    url: "https://example.com",
    link_type: "link",
    thumbnail_type: "icon",
    thumbnail_url: null,
    icon_name: "globe",
    position: 0,
    is_active: true,
    is_featured: true,
    schedule_enabled: false,
    starts_at: null,
    ends_at: null,
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
  },
  {
    id: "preview-link-2",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    title: "Instagram",
    url: "https://instagram.com/preview_user",
    link_type: "link",
    thumbnail_type: "icon",
    thumbnail_url: null,
    icon_name: "instagram",
    position: 1,
    is_active: true,
    is_featured: false,
    schedule_enabled: false,
    starts_at: null,
    ends_at: null,
    created_at: "2026-01-01T12:05:00.000Z",
    updated_at: "2026-01-01T12:05:00.000Z",
  },
  {
    id: "preview-link-3",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    title: "Novidades",
    url: null,
    link_type: "header",
    thumbnail_type: "none",
    thumbnail_url: null,
    icon_name: null,
    position: 2,
    is_active: true,
    is_featured: false,
    schedule_enabled: false,
    starts_at: null,
    ends_at: null,
    created_at: "2026-01-01T12:10:00.000Z",
    updated_at: "2026-01-01T12:10:00.000Z",
  },
];

// 1 por page (constraint themes_page_id_key) — não adicionar um segundo registro aqui.
export const previewThemes: Theme[] = [
  {
    id: "preview-theme-1",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    theme_id: "cyan-teal",
    button_style: "rounded",
    font_family: "inter",
    custom_primary_color: null,
    custom_secondary_color: null,
    custom_background_url: null,
    background_type: "gradient",
    background_value: null,
    button_radius: 16,
    text_color: null,
    accent_color: null,
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
  },
];

// 1 por page (constraint integrations_page_id_key) — não adicionar um segundo registro aqui.
export const previewIntegrations: Integration[] = [
  {
    id: "preview-integration-1",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    google_analytics_measurement_id: "G-PREVIEW123",
    meta_pixel_id: null,
    utm_source: "preview",
    utm_medium: "editor",
    utm_campaign: null,
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
  },
];

export const previewLeads: Lead[] = [
  {
    id: "preview-lead-1",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    email: "lead1@example.com",
    name: "Lead Um",
    phone: null,
    custom_fields: {},
    created_at: "2026-01-02T09:00:00.000Z",
  },
  {
    id: "preview-lead-2",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    email: "lead2@example.com",
    name: "Lead Dois",
    phone: "+55 11 90000-0000",
    custom_fields: {},
    created_at: "2026-01-02T10:30:00.000Z",
  },
];

export const previewShortLinks: ShortLink[] = [
  {
    id: "preview-shortlink-1",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    link_id: "preview-link-1",
    slug: "meusite",
    destination_url: "https://example.com",
    created_at: "2026-01-01T12:00:00.000Z",
  },
  {
    id: "preview-shortlink-2",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    link_id: null,
    slug: "promo",
    destination_url: "https://example.com/promo",
    created_at: "2026-01-01T12:00:00.000Z",
  },
];

export const previewLinkClicks: LinkClick[] = [
  {
    id: "preview-click-1",
    owner_id: PREVIEW_OWNER_ID,
    link_id: "preview-link-1",
    short_link_id: "preview-shortlink-1",
    clicked_at: "2026-01-03T14:00:00.000Z",
    referrer: "https://instagram.com",
    user_agent: "Mozilla/5.0 (preview)",
    ip_hash: "preview-hash-1",
    country: "BR",
    city: "São Paulo",
    device_type: "mobile",
    browser: "chrome",
  },
  {
    id: "preview-click-2",
    owner_id: PREVIEW_OWNER_ID,
    link_id: "preview-link-2",
    short_link_id: null,
    clicked_at: "2026-01-03T15:30:00.000Z",
    referrer: null,
    user_agent: "Mozilla/5.0 (preview)",
    ip_hash: "preview-hash-2",
    country: "BR",
    city: "Rio de Janeiro",
    device_type: "desktop",
    browser: "firefox",
  },
];

export const previewPageViews: PageView[] = [
  {
    id: "preview-view-1",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    referrer: "https://google.com",
    user_agent: "Mozilla/5.0 (preview)",
    ip_hash: "preview-hash-3",
    country: "BR",
    city: "São Paulo",
    device_type: "mobile",
    browser: "chrome",
    created_at: "2026-01-03T13:00:00.000Z",
  },
  {
    id: "preview-view-2",
    owner_id: PREVIEW_OWNER_ID,
    page_id: PREVIEW_PAGE_ID,
    referrer: null,
    user_agent: "Mozilla/5.0 (preview)",
    ip_hash: "preview-hash-4",
    country: "BR",
    city: "Belo Horizonte",
    device_type: "desktop",
    browser: "edge",
    created_at: "2026-01-03T16:45:00.000Z",
  },
];

const fixturesByTable: Record<string, unknown[]> = {
  pages: previewProfile,
  links: previewLinks,
  themes: previewThemes,
  integrations: previewIntegrations,
  leads: previewLeads,
  short_links: previewShortLinks,
  link_clicks: previewLinkClicks,
  page_views: previewPageViews,
};

export function previewRequest<T>(method: string, path: string, _body?: unknown): Promise<T> {
  const match = path.match(/^\/data\/([a-z_]+)(?:\/(.+))?$/);

  if (!match) {
    return Promise.resolve(undefined as T);
  }

  const [, table] = match;
  const rows = fixturesByTable[table] ?? [];

  if (method === "GET") {
    return Promise.resolve(rows as T);
  }

  // create/update/remove em preview: eco simples, sem persistência real.
  return Promise.resolve({} as T);
}
