// PROTEGIDO — não editável pela IA (masi.template.json, editable.protect).
// Contrato: Importantdoc.md §B5. Não redesenhar sem atualizar o manifesto.

declare global {
  interface Window {
    __MASI_GW__?: string;
    __MASI_TENANT__?: string;
    __MASI_PREVIEW__?: boolean;
  }
}

export function resolveConfig(): { gatewayUrl: string; tenantId: string } {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const qsGateway = params.get("gw");
    const qsTenant = params.get("t");
    if (qsGateway && qsTenant) {
      return { gatewayUrl: qsGateway, tenantId: qsTenant };
    }
  }

  const envGateway = import.meta.env.VITE_GATEWAY_URL as string | undefined;
  const envTenant = import.meta.env.VITE_TENANT_ID as string | undefined;
  if (envGateway && envTenant) {
    return { gatewayUrl: envGateway, tenantId: envTenant };
  }

  if (typeof window !== "undefined" && window.__MASI_GW__ && window.__MASI_TENANT__) {
    return { gatewayUrl: window.__MASI_GW__, tenantId: window.__MASI_TENANT__ };
  }

  return { gatewayUrl: envGateway ?? "", tenantId: envTenant ?? "" };
}

function isPreviewMode(): boolean {
  return typeof window !== "undefined" && window.__MASI_PREVIEW__ === true;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (isPreviewMode()) {
    const { previewRequest } = await import("./preview-fixtures");
    return previewRequest<T>(method, path, body);
  }

  const { gatewayUrl, tenantId } = resolveConfig();

  const res = await fetch(`${gatewayUrl}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// --- db: modo genérico do gateway (§B5) ---
// list/create/update/remove — sem get-by-id, sem filtro por query, sem joins.
export const db = {
  table<R = unknown>(name: string) {
    return {
      list: () => api<R[]>("GET", `/data/${name}`),
      create: (input: Partial<R>) => api<R>("POST", `/data/${name}`, input),
      update: (id: string, patch: Partial<R>) => api<R>("PATCH", `/data/${name}/${id}`, patch),
      remove: (id: string) => api<void>("DELETE", `/data/${name}/${id}`),
    };
  },
};

// --- auth: Better-Auth do tenant-gateway (§B8) ---
// Endpoints seguem a convenção padrão do Better-Auth (sign-in/sign-up/sign-out/get-session).
// ASSUNÇÃO A CONFIRMAR contra o tenant-gateway real antes de publicar: se os paths exatos
// divergirem (ex.: prefixo diferente de /api/auth), ajustar só aqui — nenhum consumidor deste
// arquivo (src/lib/auth.tsx) conhece o path bruto.
export interface GatewaySessionUser {
  id: string;
  email: string;
  name?: string | null;
  role?: "admin" | "manager" | "rep";
}

export const auth = {
  signIn: (email: string, password: string) =>
    api<{ user: GatewaySessionUser }>("POST", "/api/auth/sign-in/email", { email, password }),
  signUp: (email: string, password: string, name: string) =>
    api<{ user: GatewaySessionUser }>("POST", "/api/auth/sign-up/email", { email, password, name }),
  signOut: () => api<void>("POST", "/api/auth/sign-out"),
  me: () => api<{ user: GatewaySessionUser | null }>("GET", "/api/auth/get-session"),
};
