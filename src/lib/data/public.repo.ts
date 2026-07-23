import { resolveConfig } from "./client";
import type { Tables } from "./types.gen";

// Rotas públicas do gateway (§B6) — sem sessão, sem X-Tenant-Id obrigatório (a rota resolve o
// tenant pelo próprio handle). ASSUNÇÃO A CONFIRMAR contra o tenant-gateway real: formato exato
// dos query params e do payload agregado (ver Story 4.9 em docs/plano-construcao/04-camada-de-dados.md).

export interface PublicPageData {
  page: Tables<"pages">;
  links: Tables<"links">[];
  theme: Tables<"themes"> | null;
  integrations: Pick<
    Tables<"integrations">,
    "google_analytics_measurement_id" | "meta_pixel_id"
  > | null;
}

async function publicApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  const { gatewayUrl } = resolveConfig();
  const res = await fetch(`${gatewayUrl}${path}`, init);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Erro ao buscar dados públicos (${res.status})`);

  return (await res.json()) as T;
}

export const getPublicPageByHandle = (handle: string) =>
  publicApi<PublicPageData>(`/public/profile?handle=${encodeURIComponent(handle)}`);

export const trackLinkClick = (linkId: string) =>
  fetch(`${resolveConfig().gatewayUrl}/public/links/${linkId}/click`, { method: "POST" }).catch(
    () => undefined
  );

// PERGUNTA EM ABERTO #2 (docs/plano-construcao/06-pagina-publica-tracking.md): o guia não cita
// short_links como coberto por LinkHub nem por Forms. Isolado aqui pra trocar em 1 lugar assim
// que o dono do gateway confirmar o path real — hoje assume o padrão
// /public/<recurso>/:identificador (mesmo formato de /public/links/:id/click).
export async function resolveShortLink(
  slug: string
): Promise<{ destination_url: string } | null> {
  return publicApi<{ destination_url: string }>(
    `/public/short-links/${encodeURIComponent(slug)}`
  );
}

// PERGUNTA EM ABERTO #4 (docs/plano-construcao/06-pagina-publica-tracking.md): não fica claro se
// captura de lead deve reusar /public/forms/:id/responses (Forms) ou uma rota própria de LinkHub
// (ex.: /public/leads). Assumido aqui como rota própria — trocar só este endpoint se confirmado
// que deve reusar Forms.
export interface SubmitLeadPayload {
  page_id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  custom_fields?: Record<string, unknown>;
}

export async function submitLead(payload: SubmitLeadPayload): Promise<void> {
  const { gatewayUrl } = resolveConfig();
  const res = await fetch(`${gatewayUrl}/public/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao cadastrar");
  }
}
